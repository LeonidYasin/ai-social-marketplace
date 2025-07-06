const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class OCRMasterBot {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.stepCounter = 0;
        this.testResults = [];
        this.errorSuggestions = {
            'текст не найден': [
                'Проверьте правильность написания текста',
                'Возможно, элемент еще не загрузился - увеличьте время ожидания',
                'Проверьте, не изменился ли интерфейс',
                'Попробуйте альтернативные названия элемента'
            ],
            'таймаут': [
                'Увеличьте время ожидания',
                'Проверьте стабильность интернет-соединения',
                'Возможно, сервер перегружен',
                'Проверьте, не заблокирован ли доступ'
            ],
            'клик не выполнен': [
                'Проверьте, не перекрыт ли элемент другими элементами',
                'Возможно, элемент находится вне видимой области',
                'Попробуйте прокрутить страницу к элементу',
                'Проверьте, не изменились ли координаты элемента'
            ],
            'браузер не отвечает': [
                'Перезапустите браузер',
                'Проверьте доступность памяти',
                'Закройте другие приложения',
                'Проверьте настройки безопасности браузера'
            ]
        };
        
        // Создаем папку для скриншотов если её нет
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir);
        }
    }

    async init(browserCount = 1) {
        console.log(`🤖 Инициализация OCR бота-мастера (${browserCount} браузеров)...`);
        
        // Запускаем указанное количество браузеров
        for (let i = 0; i < browserCount; i++) {
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized', '--no-sandbox', `--user-data-dir=./user-data-${i}`]
            });
            
            const page = await browser.newPage();
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
        await this.pages[pageIndex].screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот браузера ${pageIndex + 1} сохранен: ${filename}`);
        return filename;
    }

    async findTextCoordinates(imagePath, searchText) {
        return new Promise((resolve, reject) => {
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Ошибка Tesseract:', error.message);
                    reject(error);
                    return;
                }

                // Читаем результат из файла
                const outputFile = 'output.tsv';
                if (!fs.existsSync(outputFile)) {
                    reject(new Error('Output file not found'));
                    return;
                }

                const content = fs.readFileSync(outputFile, 'utf8');
                const lines = content.trim().split('\n');
                
                if (lines.length < 2) {
                    resolve([]);
                    return;
                }

                const headers = lines[0].split('\t');
                const found = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split('\t');
                    if (values.length >= headers.length) {
                        const text = values[headers.indexOf('text')];
                        const conf = parseFloat(values[headers.indexOf('conf')]);
                        const left = parseInt(values[headers.indexOf('left')]);
                        const top = parseInt(values[headers.indexOf('top')]);
                        const width = parseInt(values[headers.indexOf('width')]);
                        const height = parseInt(values[headers.indexOf('height')]);

                        if (text && text.toLowerCase().includes(searchText.toLowerCase()) && conf > 0) {
                            found.push({
                                text: text,
                                confidence: conf,
                                x: left,
                                y: top,
                                width: width,
                                height: height,
                                centerX: left + width / 2,
                                centerY: top + height / 2
                            });
                        }
                    }
                }

                resolve(found);
            });
        });
    }

    async clickOnText(pageIndex, searchText, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Ищем текст "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `search_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length === 0) {
            const error = `Текст "${searchText}" не найден`;
            await this.handleError(error, 'текст не найден', {
                searchText,
                screenshotPath,
                browserIndex: pageIndex + 1,
                description
            });
            return false;
        }

        // Берем первый найденный элемент
        const target = coords[0];
        console.log(`✅ Браузер ${pageIndex + 1}: Найдено "${target.text}" (conf: ${target.confidence}%)`);
        console.log(`📍 Браузер ${pageIndex + 1}: Координаты: x=${target.x}, y=${target.y}, центр: (${target.centerX}, ${target.centerY})`);

        try {
            // Кликаем по центру элемента
            await this.pages[pageIndex].mouse.click(target.centerX, target.centerY);
            console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${target.centerX}, ${target.centerY})`);
            
            // Ждем немного для загрузки
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            return true;
        } catch (error) {
            await this.handleError(`Клик не выполнен: ${error.message}`, 'клик не выполнен', {
                searchText,
                coordinates: { x: target.centerX, y: target.centerY },
                browserIndex: pageIndex + 1,
                description
            });
            return false;
        }
    }

    async verifyTextExists(pageIndex, searchText, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверяем наличие текста "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `verify_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length > 0) {
            console.log(`✅ Браузер ${pageIndex + 1}: Текст "${searchText}" найден (${coords.length} совпадений)`);
            return true;
        } else {
            const error = `Текст "${searchText}" не найден`;
            await this.handleError(error, 'текст не найден', {
                searchText,
                screenshotPath,
                browserIndex: pageIndex + 1,
                description
            });
            return false;
        }
    }

    async waitForText(pageIndex, searchText, timeout = 10000, description = '') {
        console.log(`⏳ Браузер ${pageIndex + 1}: Ждем появления текста "${searchText}" ${description}`);
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const screenshotPath = await this.takeScreenshot(pageIndex, `wait_${searchText.replace(/\s+/g, '_')}`);
            const coords = await this.findTextCoordinates(screenshotPath, searchText);
            
            if (coords.length > 0) {
                console.log(`✅ Браузер ${pageIndex + 1}: Текст "${searchText}" появился через ${Date.now() - startTime}ms`);
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const error = `Текст "${searchText}" не появился за ${timeout}ms`;
        await this.handleError(error, 'таймаут', {
            searchText,
            timeout,
            browserIndex: pageIndex + 1,
            description
        });
        return false;
    }

    async handleError(errorMessage, errorType, context) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ ОШИБКА ОБНАРУЖЕНА!');
        console.log('='.repeat(60));
        console.log(`🔍 Описание: ${errorMessage}`);
        console.log(`📋 Контекст: ${JSON.stringify(context, null, 2)}`);
        
        // Предлагаем способы исправления
        console.log('\n💡 ВОЗМОЖНЫЕ СПОСОБЫ ИСПРАВЛЕНИЯ:');
        const suggestions = this.errorSuggestions[errorType] || this.errorSuggestions['текст не найден'];
        suggestions.forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion}`);
        });
        
        // Дополнительные рекомендации
        console.log('\n🔧 ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ:');
        console.log('   1. Проверьте скриншот для анализа проблемы');
        console.log('   2. Убедитесь, что серверы backend и frontend запущены');
        console.log('   3. Проверьте стабильность интернет-соединения');
        console.log('   4. Попробуйте перезапустить тест');
        
        // Сохраняем информацию об ошибке
        const errorInfo = {
            timestamp: new Date().toISOString(),
            error: errorMessage,
            type: errorType,
            context: context,
            suggestions: suggestions
        };
        
        const errorLogPath = './test_logs/error_log.json';
        if (!fs.existsSync('./test_logs')) {
            fs.mkdirSync('./test_logs', { recursive: true });
        }
        
        let errorLog = [];
        if (fs.existsSync(errorLogPath)) {
            errorLog = JSON.parse(fs.readFileSync(errorLogPath, 'utf8'));
        }
        errorLog.push(errorInfo);
        fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
        
        console.log(`\n📝 Информация об ошибке сохранена в: ${errorLogPath}`);
        console.log('='.repeat(60));
        
        // Останавливаем выполнение
        throw new Error(`КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}`);
    }

    async runScenario(scenario) {
        console.log(`\n🎬 Запуск сценария: ${scenario.name}`);
        console.log(`📝 Описание: ${scenario.description}`);
        
        const results = {
            scenario: scenario.name,
            steps: [],
            success: true,
            error: null
        };

        try {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];
                console.log(`\n📋 Шаг ${i + 1}: ${step.description}`);
                
                const stepResult = {
                    step: i + 1,
                    description: step.description,
                    success: false,
                    error: null
                };

                try {
                    switch (step.action) {
                        case 'navigate':
                            for (let j = 0; j < this.pages.length; j++) {
                                await this.pages[j].goto(step.url, { waitUntil: 'networkidle2' });
                                console.log(`✅ Браузер ${j + 1}: Переход на ${step.url}`);
                            }
                            stepResult.success = true;
                            break;
                            
                        case 'wait':
                            console.log(`⏳ Ожидание ${step.duration}ms`);
                            await new Promise(resolve => setTimeout(resolve, step.duration));
                            stepResult.success = true;
                            break;
                            
                        case 'click':
                            const clickSuccess = await this.clickOnText(step.browserIndex, step.text, step.description);
                            if (!clickSuccess && step.required !== false) {
                                throw new Error(`Не удалось кликнуть по тексту "${step.text}"`);
                            }
                            stepResult.success = clickSuccess;
                            break;
                            
                        case 'verify':
                            const verifySuccess = await this.verifyTextExists(step.browserIndex, step.text, step.description);
                            if (!verifySuccess && step.required !== false) {
                                throw new Error(`Текст "${step.text}" не найден`);
                            }
                            stepResult.success = verifySuccess;
                            break;
                            
                        case 'waitFor':
                            const waitSuccess = await this.waitForText(step.browserIndex, step.text, step.timeout, step.description);
                            if (!waitSuccess && step.required !== false) {
                                throw new Error(`Текст "${step.text}" не появился за ${step.timeout}ms`);
                            }
                            stepResult.success = waitSuccess;
                            break;
                            
                        default:
                            throw new Error(`Неизвестное действие: ${step.action}`);
                    }
                } catch (error) {
                    stepResult.error = error.message;
                    stepResult.success = false;
                    
                    // Если шаг критический, останавливаем выполнение
                    if (step.required !== false) {
                        throw error;
                    }
                }
                
                results.steps.push(stepResult);
                
                // Если шаг неудачен и критический, останавливаем сценарий
                if (!stepResult.success && step.required !== false) {
                    results.success = false;
                    results.error = stepResult.error;
                    break;
                }
            }
        } catch (error) {
            results.success = false;
            results.error = error.message;
        }

        return results;
    }

    getScenarios() {
        return {
            // Базовый сценарий тестирования
            basic: {
                name: 'Базовое тестирование',
                description: 'Проверка входа и основных элементов интерфейса',
                steps: [
                    {
                        action: 'navigate',
                        url: 'http://localhost:3000',
                        description: 'Открытие приложения в двух браузерах'
                    },
                    {
                        action: 'wait',
                        duration: 3000,
                        description: 'Ожидание загрузки'
                    },
                    {
                        action: 'verify',
                        browserIndex: 0,
                        text: 'гость',
                        description: 'на кнопке гостевого входа'
                    },
                    {
                        action: 'click',
                        browserIndex: 0,
                        text: 'гость',
                        description: 'для гостевого входа'
                    },
                    {
                        action: 'waitFor',
                        browserIndex: 0,
                        text: 'пост',
                        timeout: 10000,
                        description: 'в ленте постов'
                    },
                    {
                        action: 'verify',
                        browserIndex: 0,
                        text: 'пост',
                        description: 'в ленте'
                    }
                ]
            },

            // Мультипользовательский сценарий
            multiuser: {
                name: 'Мультипользовательское тестирование',
                description: 'Тестирование с двумя пользователями',
                steps: [
                    {
                        action: 'navigate',
                        url: 'http://localhost:3000',
                        description: 'Открытие приложения в двух браузерах'
                    },
                    {
                        action: 'wait',
                        duration: 3000,
                        description: 'Ожидание загрузки'
                    },
                    // Вход первого пользователя
                    {
                        action: 'click',
                        browserIndex: 0,
                        text: 'гость',
                        description: 'для входа первого пользователя'
                    },
                    {
                        action: 'waitFor',
                        browserIndex: 0,
                        text: 'пост',
                        timeout: 10000,
                        description: 'ожидание входа первого пользователя'
                    },
                    // Вход второго пользователя
                    {
                        action: 'click',
                        browserIndex: 1,
                        text: 'гость',
                        description: 'для входа второго пользователя'
                    },
                    {
                        action: 'waitFor',
                        browserIndex: 1,
                        text: 'пост',
                        timeout: 10000,
                        description: 'ожидание входа второго пользователя'
                    },
                    // Проверка видимости пользователей
                    {
                        action: 'verify',
                        browserIndex: 0,
                        text: 'пользователь',
                        description: 'в сайдбаре первого браузера',
                        required: false
                    },
                    {
                        action: 'verify',
                        browserIndex: 1,
                        text: 'пользователь',
                        description: 'в сайдбаре второго браузера',
                        required: false
                    }
                ]
            },

            // Сценарий создания поста
            createPost: {
                name: 'Создание поста',
                description: 'Тестирование создания нового поста',
                steps: [
                    {
                        action: 'navigate',
                        url: 'http://localhost:3000',
                        description: 'Открытие приложения'
                    },
                    {
                        action: 'wait',
                        duration: 3000,
                        description: 'Ожидание загрузки'
                    },
                    {
                        action: 'click',
                        browserIndex: 0,
                        text: 'гость',
                        description: 'для гостевого входа'
                    },
                    {
                        action: 'waitFor',
                        browserIndex: 0,
                        text: 'пост',
                        timeout: 10000,
                        description: 'ожидание входа'
                    },
                    {
                        action: 'verify',
                        browserIndex: 0,
                        text: 'создать',
                        description: 'кнопка создания поста',
                        required: false
                    },
                    {
                        action: 'click',
                        browserIndex: 0,
                        text: 'создать',
                        description: 'для создания поста',
                        required: false
                    },
                    {
                        action: 'waitFor',
                        browserIndex: 0,
                        text: 'отправить',
                        timeout: 5000,
                        description: 'форма создания поста',
                        required: false
                    }
                ]
            }
        };
    }

    async runAllScenarios() {
        console.log('🚀 Запуск всех сценариев тестирования');
        
        const scenarios = this.getScenarios();
        const results = [];

        for (const [key, scenario] of Object.entries(scenarios)) {
            console.log(`\n${'='.repeat(50)}`);
            try {
                const result = await this.runScenario(scenario);
                results.push(result);
                
                if (!result.success) {
                    console.log(`❌ Сценарий "${scenario.name}" завершился с ошибками`);
                    console.log(`🔍 Ошибка: ${result.error}`);
                    break; // Останавливаем выполнение при ошибке
                } else {
                    console.log(`✅ Сценарий "${scenario.name}" выполнен успешно`);
                }
            } catch (error) {
                console.log(`❌ Критическая ошибка в сценарии "${scenario.name}": ${error.message}`);
                results.push({
                    scenario: scenario.name,
                    success: false,
                    error: error.message,
                    steps: []
                });
                break; // Останавливаем выполнение при критической ошибке
            }
        }

        this.printSummary(results);
        return results;
    }

    printSummary(results) {
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 ИТОГОВЫЙ ОТЧЕТ');
        console.log(`${'='.repeat(60)}`);
        
        let totalScenarios = results.length;
        let successfulScenarios = results.filter(r => r.success).length;
        
        console.log(`Всего сценариев: ${totalScenarios}`);
        console.log(`Успешных: ${successfulScenarios}`);
        console.log(`Неудачных: ${totalScenarios - successfulScenarios}`);
        
        for (const result of results) {
            console.log(`\n📋 Сценарий: ${result.scenario}`);
            console.log(`Статус: ${result.success ? '✅ УСПЕХ' : '❌ ОШИБКА'}`);
            
            if (result.error) {
                console.log(`Ошибка: ${result.error}`);
            }
            
            if (result.steps && result.steps.length > 0) {
                const successfulSteps = result.steps.filter(s => s.success).length;
                console.log(`Шагов выполнено: ${successfulSteps}/${result.steps.length}`);
                
                for (const step of result.steps) {
                    const status = step.success ? '✅' : '❌';
                    console.log(`  ${status} Шаг ${step.step}: ${step.description}`);
                    if (step.error) {
                        console.log(`    Ошибка: ${step.error}`);
                    }
                }
            }
        }
        
        console.log(`\n${'='.repeat(60)}`);
        if (successfulScenarios === totalScenarios) {
            console.log('🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!');
        } else {
            console.log('⚠️ ТЕСТИРОВАНИЕ ОСТАНОВЛЕНО ИЗ-ЗА ОШИБОК');
            console.log('💡 Проверьте логи ошибок и рекомендации по исправлению');
        }
        console.log(`${'='.repeat(60)}`);
    }

    async close() {
        for (let i = 0; i < this.browsers.length; i++) {
            if (this.browsers[i]) {
                await this.browsers[i].close();
                console.log(`🔒 Браузер ${i + 1} закрыт`);
            }
        }
    }
}

// Экспорт класса для использования в других модулях
module.exports = { OCRMasterBot };

// Запуск только если файл запущен напрямую
if (require.main === module) {
    async function main() {
        const bot = new OCRMasterBot();
        
        try {
            // Инициализируем с 2 браузерами для мультипользовательского тестирования
            await bot.init(2);
            
            // Запускаем все сценарии
            const results = await bot.runAllScenarios();
            
        } catch (error) {
            console.error('❌ Критическая ошибка:', error.message);
        } finally {
            await bot.close();
        }
    }
    
    main().catch(console.error);
} 