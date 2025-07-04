const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class OCRFinalBot {
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
            modalWindows: [],
            expectedChanges: []
        };
        
        // Создаем папку для скриншотов если её нет
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir);
        }
    }

    async init(browserCount = 1) {
        console.log(`🧠 Инициализация финального OCR бота (${browserCount} браузеров)...`);
        
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

    async analyzeDOM(pageIndex) {
        console.log(`🔍 Браузер ${pageIndex + 1}: Анализ DOM структуры`);
        
        try {
            const domInfo = await this.pages[pageIndex].evaluate(() => {
                const info = {
                    title: document.title,
                    url: window.location.href,
                    modals: [],
                    buttons: [],
                    forms: [],
                    loginElements: [],
                    mainAppElements: [],
                    guestButtons: []
                };

                // Ищем модальные окна
                const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]');
                modals.forEach(modal => {
                    const rect = modal.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.modals.push({
                            tagName: modal.tagName,
                            className: modal.className,
                            id: modal.id,
                            text: modal.textContent?.substring(0, 200),
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Ищем кнопки
                const buttons = document.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
                buttons.forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const buttonText = btn.textContent?.trim() || '';
                        const ariaLabel = btn.getAttribute('aria-label') || '';
                        
                        info.buttons.push({
                            text: buttonText,
                            ariaLabel: ariaLabel,
                            className: btn.className,
                            id: btn.id,
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                        
                        // Специально ищем кнопки гостевого входа
                        if (buttonText.toLowerCase().includes('гость') || 
                            ariaLabel.toLowerCase().includes('гость') ||
                            buttonText.toLowerCase().includes('guest')) {
                            info.guestButtons.push({
                                text: buttonText,
                                ariaLabel: ariaLabel,
                                className: btn.className,
                                id: btn.id,
                                position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                            });
                        }
                    }
                });

                // Ищем формы
                const forms = document.querySelectorAll('form, [class*="form"]');
                forms.forEach(form => {
                    const rect = form.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.forms.push({
                            className: form.className,
                            id: form.id,
                            action: form.action,
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Ищем элементы входа
                const loginElements = document.querySelectorAll('[class*="login"], [class*="auth"], [class*="signin"]');
                loginElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.loginElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            visible: rect.width > 0 && rect.height > 0
                        });
                    }
                });

                // Ищем элементы основного приложения
                const mainElements = document.querySelectorAll('[class*="post"], [class*="feed"], [class*="chat"], [class*="sidebar"]');
                mainElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.mainAppElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            visible: rect.width > 0 && rect.height > 0
                        });
                    }
                });

                return info;
            });

            console.log(`📊 Браузер ${pageIndex + 1}: DOM анализ завершен`);
            console.log(`   - Модальных окон: ${domInfo.modals.length}`);
            console.log(`   - Кнопок: ${domInfo.buttons.length}`);
            console.log(`   - Кнопок гостевого входа: ${domInfo.guestButtons.length}`);
            console.log(`   - Форм: ${domInfo.forms.length}`);
            console.log(`   - Элементов входа: ${domInfo.loginElements.length}`);
            console.log(`   - Элементов приложения: ${domInfo.mainAppElements.length}`);

            return domInfo;

        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка анализа DOM:`, error.message);
            return null;
        }
    }

    async extractAllText(imagePath) {
        return new Promise((resolve, reject) => {
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    resolve([]);
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
                        
                        if (text && conf > 30) {
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

    async analyzeScreenState(pageIndex, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Комплексный анализ состояния ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `analyze_${description.replace(/\s+/g, '_')}`);
        const domInfo = await this.analyzeDOM(pageIndex);
        const allText = await this.extractAllText(screenshotPath);
        
        // Комплексный анализ состояния
        const state = this.determineAdvancedState(allText, domInfo);
        
        console.log(`📊 Браузер ${pageIndex + 1}: Определено состояние: ${state.name}`);
        console.log(`📝 Описание: ${state.description}`);
        console.log(`🔍 Признаки: ${state.indicators.join(', ')}`);
        
        return {
            state: state,
            allText: allText,
            domInfo: domInfo,
            screenshotPath: screenshotPath
        };
    }

    determineAdvancedState(allText, domInfo) {
        const textStrings = allText.map(item => item.text);
        const fullText = textStrings.join(' ');
        
        const indicators = [];
        let stateName = 'unknown';
        let description = 'Неизвестное состояние';

        // Проверяем наличие модальных окон
        const hasModals = domInfo && domInfo.modals.length > 0;
        if (hasModals) {
            indicators.push('модальные окна');
        }

        // Проверяем элементы входа
        const hasLoginElements = domInfo && domInfo.loginElements.length > 0;
        if (hasLoginElements) {
            indicators.push('элементы входа');
        }

        // Проверяем элементы основного приложения
        const hasMainElements = domInfo && domInfo.mainAppElements.length > 0;
        if (hasMainElements) {
            indicators.push('элементы приложения');
        }

        // Проверяем кнопки гостевого входа
        const hasGuestButtons = domInfo && domInfo.guestButtons.length > 0;
        if (hasGuestButtons) {
            indicators.push('кнопки гостевого входа');
        }

        // Анализируем текст и DOM для определения состояния
        if (fullText.includes('войти в систему') && fullText.includes('продолжить как гость')) {
            stateName = 'login_selection';
            description = 'Экран выбора способа входа';
            indicators.push('кнопка входа', 'кнопка гостя');
        }
        else if (fullText.includes('выберите способ входа') || fullText.includes('email') || fullText.includes('google')) {
            stateName = 'login_methods';
            description = 'Модальное окно выбора способа входа';
            indicators.push('способы входа', 'email', 'google');
        }
        else if (fullText.includes('пост') && fullText.includes('чат') && fullText.includes('комментарий')) {
            stateName = 'main_app';
            description = 'Основное приложение (пользователь вошел)';
            indicators.push('посты', 'чат', 'комментарии');
        }
        else if (fullText.includes('войти') && fullText.includes('регистрация')) {
            stateName = 'login_form';
            description = 'Форма входа';
            indicators.push('форма входа', 'регистрация');
        }
        else if (fullText.includes('ошибка') || fullText.includes('неверно')) {
            stateName = 'error_state';
            description = 'Состояние ошибки';
            indicators.push('ошибка');
        }
        else if (hasModals && hasGuestButtons) {
            stateName = 'guest_login_modal';
            description = 'Модальное окно гостевого входа';
            indicators.push('модальное окно', 'кнопки гостевого входа');
        }
        else if (hasMainElements && !hasLoginElements) {
            stateName = 'main_app';
            description = 'Основное приложение (определено по DOM)';
            indicators.push('элементы приложения');
        }

        return {
            name: stateName,
            description: description,
            indicators: indicators,
            hasModals: hasModals,
            hasLoginElements: hasLoginElements,
            hasMainElements: hasMainElements,
            hasGuestButtons: hasGuestButtons
        };
    }

    async clickViaDOM(pageIndex, searchText, description = '') {
        console.log(`🎯 Браузер ${pageIndex + 1}: Попытка клика через DOM "${searchText}" ${description}`);
        
        try {
            const result = await this.pages[pageIndex].evaluate((searchText) => {
                // Ищем кнопку по тексту
                const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"]'));
                const targetButton = buttons.find(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
                    return text.includes(searchText.toLowerCase()) || ariaLabel.includes(searchText.toLowerCase());
                });
                
                if (targetButton) {
                    const rect = targetButton.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        targetButton.click();
                        return {
                            success: true,
                            text: targetButton.textContent?.trim(),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                    }
                }
                
                return { success: false, reason: 'button_not_found' };
            }, searchText);
            
            if (result.success) {
                console.log(`✅ Браузер ${pageIndex + 1}: DOM клик успешен по кнопке "${result.text}"`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return { success: true, method: 'dom' };
            } else {
                console.log(`❌ Браузер ${pageIndex + 1}: DOM клик не удался`);
                return { success: false, method: 'dom' };
            }
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка DOM клика:`, error.message);
            return { success: false, method: 'dom', error: error.message };
        }
    }

    async clickViaCoordinates(pageIndex, searchText, description = '') {
        console.log(`🎯 Браузер ${pageIndex + 1}: Попытка клика по координатам "${searchText}" ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `search_${searchText.replace(/\s+/g, '_')}`);
        const coords = await this.findTextCoordinates(screenshotPath, searchText);
        
        if (coords.length === 0) {
            console.log(`❌ Браузер ${pageIndex + 1}: Текст "${searchText}" не найден для координатного клика`);
            return { success: false, method: 'coordinates', reason: 'text_not_found' };
        }

        // Берем первый найденный элемент
        const target = coords[0];
        console.log(`✅ Браузер ${pageIndex + 1}: Найдено "${target.text}" (conf: ${target.confidence}%)`);
        console.log(`📍 Браузер ${pageIndex + 1}: Координаты: x=${target.x}, y=${target.y}, центр: (${target.centerX}, ${target.centerY})`);

        try {
            // Кликаем по центру элемента
            await this.pages[pageIndex].mouse.click(target.centerX, target.centerY);
            console.log(`🖱️ Браузер ${pageIndex + 1}: Координатный клик по (${target.centerX}, ${target.centerY})`);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            return { success: true, method: 'coordinates' };
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка координатного клика:`, error.message);
            return { success: false, method: 'coordinates', error: error.message };
        }
    }

    async smartClickWithVerification(pageIndex, searchText, expectedState, description = '') {
        console.log(`🎯 Браузер ${pageIndex + 1}: Умный клик с проверкой "${searchText}" ${description}`);
        
        // Анализируем состояние до клика
        const beforeState = await this.analyzeScreenState(pageIndex, 'before_click');
        
        // Проверяем, не находимся ли мы уже в ожидаемом состоянии
        if (beforeState.state.name === expectedState) {
            console.log(`✅ Браузер ${pageIndex + 1}: Уже находимся в ожидаемом состоянии "${expectedState}"`);
            return { success: true, alreadyInState: true };
        }
        
        // Пробуем разные методы клика
        const clickMethods = [
            () => this.clickViaDOM(pageIndex, searchText, description),
            () => this.clickViaCoordinates(pageIndex, searchText, description)
        ];
        
        for (const clickMethod of clickMethods) {
            const clickResult = await clickMethod();
            
            if (clickResult.success) {
                // Анализируем состояние после клика
                const afterState = await this.analyzeScreenState(pageIndex, 'after_click');
                
                // Проверяем изменение состояния
                const stateChanged = beforeState.state.name !== afterState.state.name;
                const reachedExpectedState = afterState.state.name === expectedState;
                
                console.log(`🔄 Браузер ${pageIndex + 1}: Состояние изменилось: ${stateChanged ? 'ДА' : 'НЕТ'}`);
                console.log(`📊 Браузер ${pageIndex + 1}: ${beforeState.state.name} → ${afterState.state.name}`);
                console.log(`🎯 Браузер ${pageIndex + 1}: Достигнуто ожидаемое состояние: ${reachedExpectedState ? 'ДА' : 'НЕТ'}`);
                
                if (reachedExpectedState) {
                    console.log(`✅ Браузер ${pageIndex + 1}: Клик успешен (${clickResult.method}), достигнуто ожидаемое состояние`);
                    return { success: true, stateChange: true, reachedExpected: true, method: clickResult.method };
                } else if (stateChanged) {
                    console.log(`⚠️ Браузер ${pageIndex + 1}: Клик выполнен (${clickResult.method}), состояние изменилось, но не на ожидаемое`);
                    return { 
                        success: false, 
                        reason: 'unexpected_state_change',
                        expected: expectedState,
                        actual: afterState.state.name,
                        stateChange: true,
                        method: clickResult.method
                    };
                } else {
                    console.log(`❌ Браузер ${pageIndex + 1}: Клик выполнен (${clickResult.method}), но состояние не изменилось`);
                    continue; // Пробуем следующий метод
                }
            }
        }
        
        console.log(`❌ Браузер ${pageIndex + 1}: Все методы клика не сработали`);
        return { 
            success: false, 
            reason: 'all_methods_failed',
            expected: expectedState,
            actual: beforeState.state.name,
            stateChange: false
        };
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
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        console.log(`❌ Действие не выполнено после ${maxRetries} попыток`);
        return { success: false, reason: 'max_retries_exceeded' };
    }

    async smartGuestLogin(pageIndex) {
        console.log(`\n🎯 Браузер ${pageIndex + 1}: Продвинутый гостевой вход`);
        
        // Анализируем начальное состояние
        const initialState = await this.analyzeScreenState(pageIndex, 'initial');
        
        if (initialState.state.name === 'main_app') {
            console.log(`✅ Браузер ${pageIndex + 1}: Пользователь уже вошел в систему`);
            return { success: true, alreadyLoggedIn: true };
        }
        
        // Если есть модальное окно с кнопками гостевого входа, пробуем кликнуть
        if (initialState.state.hasModals && initialState.state.hasGuestButtons) {
            console.log(`🔧 Браузер ${pageIndex + 1}: Обнаружено модальное окно с кнопками гостевого входа`);
            
            // Пытаемся кликнуть по кнопке гостевого входа
            const guestLoginResult = await this.retryAction(async () => {
                return await this.smartClickWithVerification(
                    pageIndex, 
                    'гость', 
                    'main_app', 
                    'для гостевого входа'
                );
            });
            
            if (guestLoginResult.success) {
                // Дополнительная проверка входа
                const finalState = await this.analyzeScreenState(pageIndex, 'after_login');
                
                if (finalState.state.name === 'main_app' && finalState.state.hasMainElements) {
                    console.log(`✅ Браузер ${pageIndex + 1}: Гостевой вход выполнен успешно`);
                    return { success: true, loginMethod: 'guest' };
                } else {
                    console.log(`❌ Браузер ${pageIndex + 1}: Вход не выполнен, текущее состояние: ${finalState.state.name}`);
                    return { success: false, reason: 'login_failed', state: finalState.state.name };
                }
            }
            
            return guestLoginResult;
        }
        
        // Если нет модального окна, ищем кнопку входа
        console.log(`🔧 Браузер ${pageIndex + 1}: Ищем кнопку входа в систему`);
        
        const loginButtonResult = await this.retryAction(async () => {
            return await this.smartClickWithVerification(
                pageIndex, 
                'войти', 
                'guest_login_modal', 
                'для открытия окна входа'
            );
        });
        
        if (loginButtonResult.success) {
            // Теперь пробуем гостевой вход
            return await this.smartGuestLogin(pageIndex);
        }
        
        return loginButtonResult;
    }

    async runFinalTest() {
        try {
            console.log('🧠 Запуск финального тестирования');
            
            // Шаг 1: Открываем приложение
            console.log('\n📋 Шаг 1: Открытие приложения');
            for (let i = 0; i < this.pages.length; i++) {
                await this.pages[i].goto('http://localhost:3000', { waitUntil: 'networkidle2' });
                console.log(`✅ Браузер ${i + 1}: Приложение открыто`);
            }
            
            // Ждем загрузки
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Шаг 2: Продвинутый гостевой вход для всех браузеров
            console.log('\n📋 Шаг 2: Продвинутый гостевой вход');
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
            
            console.log('\n🎉 Финальное тестирование завершено успешно!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в финальном тестировании:', error.message);
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

// Запуск финального бота
async function main() {
    const bot = new OCRFinalBot();
    
    try {
        await bot.init(2); // Запускаем 2 браузера для мультипользовательского тестирования
        const success = await bot.runFinalTest();
        
        if (success) {
            console.log('\n✅ Финальное тестирование прошло успешно!');
        } else {
            console.log('\n❌ Финальное тестирование завершилось с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await bot.close();
    }
}

main().catch(console.error); 