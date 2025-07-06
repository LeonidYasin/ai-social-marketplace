const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class OCRSmartBot {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.stepCounter = 0;
        this.context = {
            currentState: 'initial',
            loginAttempts: 0,
            maxRetries: 3,
            lastAction: null,
            expectedChanges: []
        };
        
        // Создаем папку для скриншотов если её нет
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir);
        }
    }

    async init(browserCount = 1) {
        console.log(`🧠 Инициализация умного OCR бота (${browserCount} браузеров)...`);
        
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

    async analyzeScreenState(pageIndex, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Анализ состояния экрана ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `analyze_${description.replace(/\s+/g, '_')}`);
        const allText = await this.extractAllText(screenshotPath);
        
        // Анализируем состояние на основе найденного текста
        const state = this.determineState(allText);
        
        console.log(`📊 Браузер ${pageIndex + 1}: Определено состояние: ${state.name}`);
        console.log(`📝 Ключевые элементы: ${state.keyElements.join(', ')}`);
        
        return {
            state: state,
            allText: allText,
            screenshotPath: screenshotPath
        };
    }

    async extractAllText(imagePath) {
        return new Promise((resolve, reject) => {
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                const outputFile = 'output.tsv';
                if (!fs.existsSync(outputFile)) {
                    resolve([]);
                    return;
                }

                const content = fs.readFileSync(outputFile, 'utf8');
                const lines = content.trim().split('\n');
                
                if (lines.length < 2) {
                    resolve([]);
                    return;
                }

                const headers = lines[0].split('\t');
                const allText = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split('\t');
                    if (values.length >= headers.length) {
                        const text = values[headers.indexOf('text')];
                        const conf = parseFloat(values[headers.indexOf('conf')]);
                        
                        if (text && conf > 30) { // Фильтруем по уверенности
                            allText.push({
                                text: text.toLowerCase(),
                                confidence: conf
                            });
                        }
                    }
                }

                resolve(allText);
            });
        });
    }

    determineState(allText) {
        const textStrings = allText.map(item => item.text);
        const fullText = textStrings.join(' ');

        // Определяем состояние на основе контекста
        if (fullText.includes('войти в систему') && fullText.includes('продолжить как гость')) {
            return {
                name: 'login_selection',
                keyElements: ['войти в систему', 'продолжить как гость'],
                description: 'Экран выбора способа входа'
            };
        }
        
        if (fullText.includes('выберите способ входа') || fullText.includes('email') || fullText.includes('google')) {
            return {
                name: 'login_methods',
                keyElements: ['email', 'google', 'выберите способ'],
                description: 'Модальное окно выбора способа входа'
            };
        }
        
        if (fullText.includes('пост') && fullText.includes('чат') && fullText.includes('комментарий')) {
            return {
                name: 'main_app',
                keyElements: ['пост', 'чат', 'комментарий'],
                description: 'Основное приложение (пользователь вошел)'
            };
        }
        
        if (fullText.includes('войти') && fullText.includes('регистрация')) {
            return {
                name: 'login_form',
                keyElements: ['войти', 'регистрация'],
                description: 'Форма входа'
            };
        }
        
        if (fullText.includes('ошибка') || fullText.includes('неверно')) {
            return {
                name: 'error_state',
                keyElements: ['ошибка', 'неверно'],
                description: 'Состояние ошибки'
            };
        }

        return {
            name: 'unknown',
            keyElements: textStrings.slice(0, 5),
            description: 'Неизвестное состояние'
        };
    }

    async smartClick(pageIndex, searchText, expectedState, description = '') {
        console.log(`🎯 Браузер ${pageIndex + 1}: Умный клик по "${searchText}" ${description}`);
        
        // Анализируем состояние до клика
        const beforeState = await this.analyzeScreenState(pageIndex, 'before_click');
        
        // Ищем элемент для клика
        const screenshotPath = await this.takeScreenshot(pageIndex, `search_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length === 0) {
            console.log(`❌ Браузер ${pageIndex + 1}: Текст "${searchText}" не найден`);
            return { success: false, reason: 'element_not_found' };
        }

        // Берем первый найденный элемент
        const target = coords[0];
        console.log(`✅ Браузер ${pageIndex + 1}: Найдено "${target.text}" (conf: ${target.confidence}%)`);
        console.log(`📍 Браузер ${pageIndex + 1}: Координаты: x=${target.x}, y=${target.y}, центр: (${target.centerX}, ${target.centerY})`);

        // Кликаем по центру элемента
        await this.pages[pageIndex].mouse.click(target.centerX, target.centerY);
        console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${target.centerX}, ${target.centerY})`);
        
        // Ждем изменения состояния
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Анализируем состояние после клика
        const afterState = await this.analyzeScreenState(pageIndex, 'after_click');
        
        // Проверяем, изменилось ли состояние
        const stateChanged = beforeState.state.name !== afterState.state.name;
        
        console.log(`🔄 Браузер ${pageIndex + 1}: Состояние изменилось: ${stateChanged ? 'ДА' : 'НЕТ'}`);
        console.log(`📊 Браузер ${pageIndex + 1}: ${beforeState.state.name} → ${afterState.state.name}`);
        
        // Проверяем ожидаемое состояние
        if (expectedState && afterState.state.name !== expectedState) {
            console.log(`❌ Браузер ${pageIndex + 1}: Ожидалось состояние "${expectedState}", получено "${afterState.state.name}"`);
            return { 
                success: false, 
                reason: 'unexpected_state',
                expected: expectedState,
                actual: afterState.state.name
            };
        }
        
        if (stateChanged) {
            console.log(`✅ Браузер ${pageIndex + 1}: Клик успешен, состояние изменилось`);
            return { success: true, stateChange: true };
        } else {
            console.log(`⚠️ Браузер ${pageIndex + 1}: Клик выполнен, но состояние не изменилось`);
            return { success: true, stateChange: false };
        }
    }

    async retryAction(action, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`🔄 Попытка ${attempt}/${maxRetries}`);
            
            const result = await action();
            
            if (result.success) {
                console.log(`✅ Действие выполнено успешно на попытке ${attempt}`);
                return result;
            }
            
            if (attempt < maxRetries) {
                console.log(`⏳ Ожидание перед повторной попыткой...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log(`❌ Действие не выполнено после ${maxRetries} попыток`);
        return { success: false, reason: 'max_retries_exceeded' };
    }

    async smartGuestLogin(pageIndex) {
        console.log(`\n🎯 Браузер ${pageIndex + 1}: Умный гостевой вход`);
        
        // Анализируем начальное состояние
        const initialState = await this.analyzeScreenState(pageIndex, 'initial');
        
        if (initialState.state.name === 'main_app') {
            console.log(`✅ Браузер ${pageIndex + 1}: Пользователь уже вошел в систему`);
            return { success: true, alreadyLoggedIn: true };
        }
        
        // Пытаемся найти и кликнуть по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"
        const guestLoginResult = await this.retryAction(async () => {
            return await this.smartClick(
                pageIndex, 
                'гость', 
                'main_app', 
                'для гостевого входа'
            );
        });
        
        if (guestLoginResult.success) {
            // Проверяем, что действительно вошли в систему
            const finalState = await this.analyzeScreenState(pageIndex, 'after_login');
            
            if (finalState.state.name === 'main_app') {
                console.log(`✅ Браузер ${pageIndex + 1}: Гостевой вход выполнен успешно`);
                return { success: true, loginMethod: 'guest' };
            } else {
                console.log(`❌ Браузер ${pageIndex + 1}: Вход не выполнен, текущее состояние: ${finalState.state.name}`);
                return { success: false, reason: 'login_failed', state: finalState.state.name };
            }
        }
        
        return guestLoginResult;
    }

    async runSmartTest() {
        try {
            console.log('🧠 Запуск умного тестирования');
            
            // Шаг 1: Открываем приложение
            console.log('\n📋 Шаг 1: Открытие приложения');
            for (let i = 0; i < this.pages.length; i++) {
                await this.pages[i].goto('http://localhost:3000', { waitUntil: 'networkidle2' });
                console.log(`✅ Браузер ${i + 1}: Приложение открыто`);
            }
            
            // Ждем загрузки
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Шаг 2: Умный гостевой вход для всех браузеров
            console.log('\n📋 Шаг 2: Умный гостевой вход');
            const loginResults = [];
            
            for (let i = 0; i < this.pages.length; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                const loginResult = await this.smartGuestLogin(i);
                loginResults.push(loginResult);
                
                if (!loginResult.success) {
                    console.log(`❌ Браузер ${i + 1}: Вход не выполнен`);
                    return false;
                }
            }
            
            // Шаг 3: Проверяем мультипользовательское взаимодействие
            if (this.pages.length > 1) {
                console.log('\n📋 Шаг 3: Проверка мультипользовательского взаимодействия');
                
                // Проверяем, что пользователи видят друг друга
                for (let i = 0; i < this.pages.length; i++) {
                    const state = await this.analyzeScreenState(i, 'multiuser_check');
                    
                    // Ищем признаки других пользователей
                    const hasOtherUsers = state.allText.some(item => 
                        item.text.includes('пользователь') || 
                        item.text.includes('user') || 
                        item.text.includes('гость')
                    );
                    
                    if (hasOtherUsers) {
                        console.log(`✅ Браузер ${i + 1}: Другие пользователи обнаружены`);
                    } else {
                        console.log(`⚠️ Браузер ${i + 1}: Другие пользователи не найдены`);
                    }
                }
            }
            
            console.log('\n🎉 Умное тестирование завершено успешно!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в умном тестировании:', error.message);
            return false;
        }
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

// Запуск умного бота
async function main() {
    const bot = new OCRSmartBot();
    
    try {
        await bot.init(2); // Запускаем 2 браузера для мультипользовательского тестирования
        const success = await bot.runSmartTest();
        
        if (success) {
            console.log('\n✅ Умное тестирование прошло успешно!');
        } else {
            console.log('\n❌ Умное тестирование завершилось с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await bot.close();
    }
}

main().catch(console.error); 