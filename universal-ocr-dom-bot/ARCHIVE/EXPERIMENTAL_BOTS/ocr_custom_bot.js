const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class OCRCustomBot {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.stepCounter = 0;
        this.testResults = [];
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Создаем папку для скриншотов если её нет
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir);
        }
    }

    async init(browserCount = 1) {
        console.log(`🤖 Инициализация OCR кастомного бота (${browserCount} браузеров)...`);
        
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
            console.log(`❌ Браузер ${pageIndex + 1}: Текст "${searchText}" не найден`);
            return false;
        }

        // Берем первый найденный элемент
        const target = coords[0];
        console.log(`✅ Браузер ${pageIndex + 1}: Найдено "${target.text}" (conf: ${target.confidence}%)`);
        console.log(`📍 Браузер ${pageIndex + 1}: Координаты: x=${target.x}, y=${target.y}, центр: (${target.centerX}, ${target.centerY})`);

        // Кликаем по центру элемента
        await this.pages[pageIndex].mouse.click(target.centerX, target.centerY);
        console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${target.centerX}, ${target.centerY})`);
        
        // Ждем немного для загрузки
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return true;
    }

    async verifyTextExists(pageIndex, searchText, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверяем наличие текста "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `verify_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length > 0) {
            console.log(`✅ Браузер ${pageIndex + 1}: Текст "${searchText}" найден (${coords.length} совпадений)`);
            return true;
        } else {
            console.log(`❌ Браузер ${pageIndex + 1}: Текст "${searchText}" не найден`);
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
        
        console.log(`❌ Браузер ${pageIndex + 1}: Текст "${searchText}" не появился за ${timeout}ms`);
        return false;
    }

    async runStep(step) {
        console.log(`\n📋 Выполнение: ${step.description}`);
        
        try {
            switch (step.action) {
                case 'navigate':
                    for (let j = 0; j < this.pages.length; j++) {
                        await this.pages[j].goto(step.url, { waitUntil: 'networkidle2' });
                        console.log(`✅ Браузер ${j + 1}: Переход на ${step.url}`);
                    }
                    return true;

                case 'wait':
                    await new Promise(resolve => setTimeout(resolve, step.duration));
                    console.log(`⏳ Ожидание ${step.duration}ms`);
                    return true;

                case 'click':
                    return await this.clickOnText(step.browserIndex, step.text, step.description);

                case 'verify':
                    return await this.verifyTextExists(step.browserIndex, step.text, step.description);

                case 'waitFor':
                    return await this.waitForText(step.browserIndex, step.text, step.timeout, step.description);

                default:
                    console.error(`❌ Неизвестное действие: ${step.action}`);
                    return false;
            }
        } catch (error) {
            console.error(`❌ Ошибка в шаге: ${error.message}`);
            return false;
        }
    }

    async createCustomScenario() {
        console.log('\n🎬 Создание пользовательского сценария');
        
        const scenario = {
            name: '',
            description: '',
            steps: []
        };

        // Запрашиваем название сценария
        scenario.name = await this.question('Введите название сценария: ');
        scenario.description = await this.question('Введите описание сценария: ');

        console.log('\n📝 Доступные действия:');
        console.log('1. navigate - переход на URL');
        console.log('2. wait - ожидание (мс)');
        console.log('3. click - клик по тексту');
        console.log('4. verify - проверка наличия текста');
        console.log('5. waitFor - ожидание появления текста');
        console.log('6. finish - завершить создание сценария');

        let stepNumber = 1;
        while (true) {
            console.log(`\n--- Шаг ${stepNumber} ---`);
            
            const action = await this.question('Выберите действие (1-6): ');
            
            if (action === '6' || action.toLowerCase() === 'finish') {
                break;
            }

            const step = {
                description: await this.question('Описание шага: ')
            };

            switch (action) {
                case '1':
                    step.action = 'navigate';
                    step.url = await this.question('URL: ');
                    break;

                case '2':
                    step.action = 'wait';
                    step.duration = parseInt(await this.question('Длительность (мс): '));
                    break;

                case '3':
                    step.action = 'click';
                    step.browserIndex = parseInt(await this.question('Номер браузера (1-2): ')) - 1;
                    step.text = await this.question('Текст для поиска: ');
                    break;

                case '4':
                    step.action = 'verify';
                    step.browserIndex = parseInt(await this.question('Номер браузера (1-2): ')) - 1;
                    step.text = await this.question('Текст для поиска: ');
                    break;

                case '5':
                    step.action = 'waitFor';
                    step.browserIndex = parseInt(await this.question('Номер браузера (1-2): ')) - 1;
                    step.text = await this.question('Текст для поиска: ');
                    step.timeout = parseInt(await this.question('Таймаут (мс): '));
                    break;

                default:
                    console.log('❌ Неверный выбор действия');
                    continue;
            }

            scenario.steps.push(step);
            stepNumber++;
        }

        return scenario;
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer);
            });
        });
    }

    async runScenario(scenario) {
        console.log(`\n🎬 Запуск сценария: ${scenario.name}`);
        console.log(`📝 Описание: ${scenario.description}`);
        
        const results = {
            scenario: scenario.name,
            steps: [],
            success: true
        };

        for (let i = 0; i < scenario.steps.length; i++) {
            const step = scenario.steps[i];
            
            const stepResult = {
                step: i + 1,
                description: step.description,
                success: false,
                error: null
            };

            try {
                stepResult.success = await this.runStep(step);
                
                if (!stepResult.success) {
                    stepResult.error = `Шаг не выполнен`;
                    results.success = false;
                    
                    const continueTest = await this.question('\n❌ Шаг не выполнен. Продолжить тест? (y/n): ');
                    if (continueTest.toLowerCase() !== 'y') {
                        break;
                    }
                }
            } catch (error) {
                stepResult.error = error.message;
                results.success = false;
                console.error(`❌ Ошибка в шаге ${i + 1}:`, error.message);
            }

            results.steps.push(stepResult);
        }

        this.testResults.push(results);
        return results;
    }

    async interactiveMode() {
        console.log('🎮 Интерактивный режим тестирования');
        console.log('Доступные команды:');
        console.log('1. create - создать новый сценарий');
        console.log('2. run - запустить предустановленный сценарий');
        console.log('3. manual - ручное управление');
        console.log('4. exit - выход');

        while (true) {
            const command = await this.question('\nВведите команду: ');

            switch (command.toLowerCase()) {
                case 'create':
                    const scenario = await this.createCustomScenario();
                    await this.runScenario(scenario);
                    break;

                case 'run':
                    await this.runPresetScenarios();
                    break;

                case 'manual':
                    await this.manualControl();
                    break;

                case 'exit':
                    console.log('👋 Выход из интерактивного режима');
                    return;

                default:
                    console.log('❌ Неизвестная команда');
                    break;
            }
        }
    }

    async runPresetScenarios() {
        console.log('\n📋 Предустановленные сценарии:');
        console.log('1. basic - базовое тестирование');
        console.log('2. multiuser - мультипользовательское тестирование');
        console.log('3. create_post - создание поста');

        const choice = await this.question('Выберите сценарий (1-3): ');

        const scenarios = {
            '1': {
                name: 'Базовое тестирование',
                description: 'Проверка входа и основных элементов интерфейса',
                steps: [
                    { action: 'navigate', url: 'http://localhost:3000', description: 'Открытие приложения' },
                    { action: 'wait', duration: 3000, description: 'Ожидание загрузки' },
                    { action: 'verify', browserIndex: 0, text: 'гость', description: 'на кнопке гостевого входа' },
                    { action: 'click', browserIndex: 0, text: 'гость', description: 'для гостевого входа' },
                    { action: 'waitFor', browserIndex: 0, text: 'пост', timeout: 10000, description: 'в ленте постов' }
                ]
            },
            '2': {
                name: 'Мультипользовательское тестирование',
                description: 'Тестирование с двумя пользователями',
                steps: [
                    { action: 'navigate', url: 'http://localhost:3000', description: 'Открытие приложения' },
                    { action: 'wait', duration: 3000, description: 'Ожидание загрузки' },
                    { action: 'click', browserIndex: 0, text: 'гость', description: 'для входа первого пользователя' },
                    { action: 'waitFor', browserIndex: 0, text: 'пост', timeout: 10000, description: 'ожидание входа первого пользователя' },
                    { action: 'click', browserIndex: 1, text: 'гость', description: 'для входа второго пользователя' },
                    { action: 'waitFor', browserIndex: 1, text: 'пост', timeout: 10000, description: 'ожидание входа второго пользователя' }
                ]
            },
            '3': {
                name: 'Создание поста',
                description: 'Тестирование создания нового поста',
                steps: [
                    { action: 'navigate', url: 'http://localhost:3000', description: 'Открытие приложения' },
                    { action: 'wait', duration: 3000, description: 'Ожидание загрузки' },
                    { action: 'click', browserIndex: 0, text: 'гость', description: 'для гостевого входа' },
                    { action: 'waitFor', browserIndex: 0, text: 'пост', timeout: 10000, description: 'ожидание входа' },
                    { action: 'verify', browserIndex: 0, text: 'создать', description: 'кнопка создания поста' }
                ]
            }
        };

        if (scenarios[choice]) {
            await this.runScenario(scenarios[choice]);
        } else {
            console.log('❌ Неверный выбор сценария');
        }
    }

    async manualControl() {
        console.log('\n🎮 Ручное управление браузерами');
        console.log('Доступные команды:');
        console.log('1. click <browser> <text> - клик по тексту');
        console.log('2. verify <browser> <text> - проверить наличие текста');
        console.log('3. wait <browser> <text> <timeout> - ждать появления текста');
        console.log('4. screenshot <browser> - сделать скриншот');
        console.log('5. back - вернуться в главное меню');

        while (true) {
            const command = await this.question('\nВведите команду: ');

            if (command.toLowerCase() === 'back') {
                break;
            }

            const parts = command.split(' ');
            const action = parts[0];

            try {
                switch (action) {
                    case 'click':
                        const browserIndex = parseInt(parts[1]) - 1;
                        const text = parts.slice(2).join(' ');
                        await this.clickOnText(browserIndex, text);
                        break;

                    case 'verify':
                        const browserIndex2 = parseInt(parts[1]) - 1;
                        const text2 = parts.slice(2).join(' ');
                        await this.verifyTextExists(browserIndex2, text2);
                        break;

                    case 'wait':
                        const browserIndex3 = parseInt(parts[1]) - 1;
                        const text3 = parts.slice(2, -1).join(' ');
                        const timeout = parseInt(parts[parts.length - 1]);
                        await this.waitForText(browserIndex3, text3, timeout);
                        break;

                    case 'screenshot':
                        const browserIndex4 = parseInt(parts[1]) - 1;
                        await this.takeScreenshot(browserIndex4, 'manual');
                        break;

                    default:
                        console.log('❌ Неизвестная команда');
                        break;
                }
            } catch (error) {
                console.error('❌ Ошибка выполнения команды:', error.message);
            }
        }
    }

    async close() {
        this.rl.close();
        for (let i = 0; i < this.browsers.length; i++) {
            if (this.browsers[i]) {
                await this.browsers[i].close();
                console.log(`🔒 Браузер ${i + 1} закрыт`);
            }
        }
    }
}

// Запуск интерактивного бота
async function main() {
    const bot = new OCRCustomBot();
    
    try {
        console.log('🤖 OCR Кастомный Бот для Тестирования');
        console.log('=====================================');
        
        const browserCount = parseInt(process.argv[2]) || 2;
        await bot.init(browserCount);
        
        await bot.interactiveMode();
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await bot.close();
    }
}

main().catch(console.error); 