const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

class AdvancedScreenshotModule {
    constructor(options = {}) {
        this.browser = null;
        this.page = null;
        this.settings = {
            baseUrl: 'http://localhost:3000',
            outputDir: 'documentation_screenshots',
            viewport: { width: 1920, height: 1080 },
            headless: false,
            timeout: 10000,
            delay: 2000,
            tesseractPath: 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
            useOCR: true, // Включаем OCR для полноценного анализа
            ...options
        };
        
        this.screenshots = [];
        this.errors = [];
        this.warnings = [];
        this.ocrCoordinates = null;
        this.currentState = null;
        
        // Логгер
        this.logger = {
            info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
            warn: (msg) => console.log(`[${new Date().toISOString()}] [WARN] ${msg}`),
            error: (msg) => console.log(`[${new Date().toISOString()}] [ERROR] ${msg}`),
            debug: (msg) => console.log(`[${new Date().toISOString()}] [DEBUG] ${msg}`)
        };
    }

    async checkTesseract() {
        try {
            this.logger.info('🔍 Проверка наличия Tesseract...');
            const version = execSync(`"${this.settings.tesseractPath}" --version`, { encoding: 'utf8', timeout: 5000 });
            this.logger.info(`✅ Tesseract найден: ${version.split('\n')[0]}`);
            return true;
        } catch (error) {
            const msg = `❌ Критическая ошибка: Tesseract не найден или не запускается по пути: ${this.settings.tesseractPath}\nПроверьте, что Tesseract установлен, путь указан верно, и переменные среды настроены.\nСкачайте: https://github.com/tesseract-ocr/tesseract\nДобавьте путь к tesseract.exe в PATH или настройте settings.tesseractPath`;
            this.logger.error(msg);
            throw new Error(msg);
        }
    }

    async init() {
        this.logger.info('🚀 Инициализация продвинутого модуля создания скриншотов...');
        await this.checkTesseract();
        
        this.browser = await puppeteer.launch({
            headless: this.settings.headless,
            defaultViewport: this.settings.viewport
        });
        
        this.page = await this.browser.newPage();
        await this.page.goto(this.settings.baseUrl, { waitUntil: 'networkidle2' });
        await this.delay(3000);
        
        // Загружаем OCR координаты
        await this.loadOCRCoordinates();
        
        this.logger.info('✅ Модуль инициализирован');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async loadOCRCoordinates() {
        try {
            // Ищем файл с координатами
            const files = fs.readdirSync('.').filter(f => f.startsWith('ocr_coordinates_') && f.endsWith('.json'));
            if (files.length === 0) {
                throw new Error('Файл с OCR координатами не найден. Запустите debug_ocr_coordinates.js сначала.');
            }
            
            const latestFile = files.sort().pop();
            const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
            this.ocrCoordinates = data.coordinates;
            
            this.logger.info(`📊 Загружено ${this.ocrCoordinates.length} OCR координат из ${latestFile}`);
        } catch (error) {
            this.logger.error(`❌ Ошибка загрузки OCR координат: ${error.message}`);
            throw error;
        }
    }

    async analyzeScreenState(description = '', folder = 'states', stepIndex = null) {
        this.logger.info(`🔍 Комплексный анализ состояния: ${description}`);
        
        // Создаём временный скриншот для OCR в папке temp
        const tempFolder = path.join(this.settings.outputDir, 'temp');
        if (!fs.existsSync(tempFolder)) {
            fs.mkdirSync(tempFolder, { recursive: true });
        }
        const tempScreenshotPath = path.join(tempFolder, 'ocr_temp.png');
        await this.page.screenshot({ path: tempScreenshotPath, fullPage: true });
        
        // Анализируем DOM
        const domInfo = await this.analyzeDOM();
        if (!domInfo) {
            const msg = '❌ Критическая ошибка: DOM-анализ не удался. Проверьте структуру страницы или селекторы.';
            this.logger.error(msg);
            throw new Error(msg);
        }
        
        // Извлекаем текст через OCR (теперь всегда передаём путь к скриншоту)
        const allText = await this.extractAllText(tempScreenshotPath);
        if (!allText || !Array.isArray(allText) || allText.length === 0) {
            const msg = '❌ Критическая ошибка: OCR-анализ не удался или не найден текст. Проверьте Tesseract, путь к файлу, язык и качество скриншота.';
            this.logger.error(msg);
            throw new Error(msg);
        }
        
        // Определяем состояние
        const state = this.determineState(allText, domInfo);
        
        // Сохраняем финальный скриншот с автоименованием в правильной папке
        const screenshotPath = await this.takeScreenshotAutoNamed(state, description, folder, stepIndex);
        
        // Удаляем временный файл
        try {
            if (fs.existsSync(tempScreenshotPath)) {
                fs.unlinkSync(tempScreenshotPath);
            }
        } catch (error) {
            this.logger.warn(`⚠️ Не удалось удалить временный файл: ${error.message}`);
        }
        
        this.currentState = {
            state: state,
            allText: allText,
            domInfo: domInfo,
            screenshotPath: screenshotPath,
            timestamp: new Date().toISOString()
        };
        
        this.logger.info(`📊 Определено состояние: ${state.name}`);
        this.logger.info(`📝 Описание: ${state.description}`);
        this.logger.info(`🔍 Признаки: ${state.indicators.join(', ')}`);
        
        return this.currentState;
    }

    async analyzeDOM() {
        try {
            const domInfo = await this.page.evaluate(() => {
                const info = {
                    title: document.title,
                    url: window.location.href,
                    modals: [],
                    buttons: [],
                    forms: [],
                    loginElements: [],
                    mainAppElements: [],
                    guestButtons: [],
                    emailButtons: [],
                    postElements: [],
                    chatElements: [],
                    sidebarElements: []
                };

                // Ищем модальные окна
                const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]');
                modals.forEach(modal => {
                    const rect = modal.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.modals.push({
                            tagName: modal.tagName,
                            className: modal.className,
                            text: modal.textContent?.substring(0, 200),
                            visible: true,
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
                            visible: true,
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
                                position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                            });
                        }
                        
                        // Специально ищем кнопки email
                        if (buttonText.toLowerCase().includes('email') || 
                            ariaLabel.toLowerCase().includes('email') ||
                            buttonText.toLowerCase().includes('почта')) {
                            info.emailButtons.push({
                                text: buttonText,
                                ariaLabel: ariaLabel,
                                className: btn.className,
                                position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                            });
                        }
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
                            visible: true
                        });
                    }
                });

                // Ищем элементы постов
                const postElements = document.querySelectorAll('[class*="post"], [class*="feed"], [class*="card"]');
                postElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.postElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            visible: true
                        });
                    }
                });

                // Ищем элементы чата
                const chatElements = document.querySelectorAll('[class*="chat"], [class*="message"], [class*="conversation"]');
                chatElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.chatElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            visible: true
                        });
                    }
                });

                // Ищем элементы сайдбара
                const sidebarElements = document.querySelectorAll('[class*="sidebar"], [class*="nav"], [class*="menu"]');
                sidebarElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.sidebarElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            visible: true
                        });
                    }
                });

                // Ищем элементы основного приложения
                const mainElements = document.querySelectorAll('[class*="app"], [class*="main"], [class*="content"]');
                mainElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.mainAppElements.push({
                            tagName: el.tagName,
                            className: el.className,
                            text: el.textContent?.substring(0, 100),
                            visible: true
                        });
                    }
                });

                return info;
            });

            this.logger.debug(`📊 DOM анализ: ${domInfo.buttons.length} кнопок, ${domInfo.modals.length} модальных окон`);
            return domInfo;

        } catch (error) {
            this.logger.error(`❌ Ошибка анализа DOM: ${error.message}`);
            throw error;
        }
    }

    async extractAllText(imagePath) {
        if (!this.settings.useOCR) {
            // Если OCR отключен, извлекаем текст из DOM
            try {
                const pageText = await this.page.evaluate(() => {
                    const elements = document.querySelectorAll('button, input, textarea, div, span, p, h1, h2, h3, h4, h5, h6');
                    const textItems = [];
                    
                    elements.forEach((el, index) => {
                        const text = el.textContent?.trim();
                        if (text && text.length > 0) {
                            const rect = el.getBoundingClientRect();
                            textItems.push({
                                text: text,
                                confidence: 100, // Высокая уверенность для DOM
                                x: Math.round(rect.x),
                                y: Math.round(rect.y),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            });
                        }
                    });
                    
                    return textItems;
                });
                
                this.logger.debug(`📄 Извлечено ${pageText.length} текстовых элементов из DOM`);
                return pageText;
            } catch (error) {
                this.logger.warn(`⚠️ Ошибка извлечения текста из DOM: ${error.message}`);
                return [];
            }
        }
        
        try {
            if (!imagePath) throw new Error('Путь к изображению не передан в extractAllText');
            const tesseractCmd = `"${this.settings.tesseractPath}" "${imagePath}" output -l rus+eng --oem 3 --psm 6 tsv`;
            this.logger.debug(`🔍 Запуск OCR: ${tesseractCmd}`);
            execSync(tesseractCmd, { encoding: 'utf8', timeout: 20000 });
            if (!fs.existsSync('output.tsv')) throw new Error('Файл output.tsv не создан Tesseract');
            const content = fs.readFileSync('output.tsv', 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const textItems = [];
            for (let i = 1; i < lines.length; i++) { // Пропускаем заголовок
                const parts = lines[i].split('\t');
                if (parts.length >= 12) {
                    const text = parts[11]?.trim();
                    if (text && text.length > 0) {
                        textItems.push({
                            text: text,
                            confidence: parseInt(parts[10]) || 0,
                            x: parseInt(parts[6]) || 0,
                            y: parseInt(parts[7]) || 0,
                            width: parseInt(parts[8]) || 0,
                            height: parseInt(parts[9]) || 0
                        });
                    }
                }
            }
            
            this.logger.debug(`📄 Извлечено ${textItems.length} текстовых элементов из OCR`);
            return textItems;
        } catch (error) {
            const msg = `❌ Критическая ошибка OCR: ${error.message}\nПроверьте: что Tesseract установлен, путь указан верно, файл изображения существует, язык поддерживается, нет проблем с правами доступа.`;
            this.logger.error(msg);
            throw new Error(msg);
        }
    }

    determineState(allText, domInfo) {
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

        // Проверяем элементы постов
        const hasPostElements = domInfo && domInfo.postElements.length > 0;
        if (hasPostElements) {
            indicators.push('элементы постов');
        }

        // Проверяем элементы чата
        const hasChatElements = domInfo && domInfo.chatElements.length > 0;
        if (hasChatElements) {
            indicators.push('элементы чата');
        }

        // Проверяем элементы сайдбара
        const hasSidebarElements = domInfo && domInfo.sidebarElements.length > 0;
        if (hasSidebarElements) {
            indicators.push('элементы сайдбара');
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

        // Проверяем кнопки email
        const hasEmailButtons = domInfo && domInfo.emailButtons.length > 0;
        if (hasEmailButtons) {
            indicators.push('кнопки email');
        }

        // ЛОГИКА ОПРЕДЕЛЕНИЯ СОСТОЯНИЯ
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
        // Если есть элементы приложения, но нет модальных окон - пользователь уже вошел
        else if ((hasPostElements || hasChatElements || hasSidebarElements || hasMainElements) && !hasModals) {
            stateName = 'main_app';
            description = 'Основное приложение (пользователь уже вошел)';
            indicators.push('элементы приложения', 'пользователь вошел');
        }
        // Если есть модальное окно с кнопками гостевого входа
        else if (hasModals && hasGuestButtons) {
            stateName = 'guest_login_modal';
            description = 'Модальное окно гостевого входа';
            indicators.push('модальное окно', 'кнопки гостевого входа');
        }
        // Если есть кнопки гостевого входа без модального окна - возможно, пользователь уже вошел
        else if (hasGuestButtons && !hasModals) {
            stateName = 'main_app';
            description = 'Основное приложение (есть кнопки гостевого входа, но нет модального окна)';
            indicators.push('кнопки гостевого входа', 'пользователь вошел');
        }

        return {
            name: stateName,
            description: description,
            indicators: indicators,
            hasModals: hasModals,
            hasLoginElements: hasLoginElements,
            hasPostElements: hasPostElements,
            hasChatElements: hasChatElements,
            hasSidebarElements: hasSidebarElements,
            hasMainElements: hasMainElements,
            hasGuestButtons: hasGuestButtons,
            hasEmailButtons: hasEmailButtons
        };
    }

    async clickByOCRCoordinates(buttonText, description = '') {
        this.logger.info(`🎯 Клик по OCR координатам: "${buttonText}" ${description}`);
        
        // Ищем кнопку в OCR координатах
        const button = this.ocrCoordinates.find(coord => 
            coord.text.toLowerCase().includes(buttonText.toLowerCase())
        );
        
        if (!button) {
            const error = `Кнопка "${buttonText}" не найдена в OCR координатах`;
            this.logger.error(`❌ ${error}`);
            throw new Error(error);
        }
        
        this.logger.info(`📍 Найдена кнопка "${button.text}" в точке (${button.x}, ${button.y})`);
        
        try {
            // Кликаем по координатам
            await this.page.mouse.click(button.x, button.y);
            this.logger.info(`✅ Клик выполнен по координатам (${button.x}, ${button.y})`);
            await this.delay(this.settings.delay);
            return true;
        } catch (error) {
            const errorMsg = `Ошибка клика по координатам (${button.x}, ${button.y}): ${error.message}`;
            this.logger.error(`❌ ${errorMsg}`);
            throw new Error(errorMsg);
        }
    }

    async takeScreenshotAutoNamed(state, details = '', folder = 'states', stepIndex = null) {
        try {
            // Формируем имя файла по анализу состояния
            let nameParts = [];
            if (stepIndex !== null) nameParts.push(String(stepIndex).padStart(2, '0'));
            if (state && state.name) nameParts.push(state.name);
            if (details) nameParts.push(details.replace(/\s+/g, '_'));
            const filename = nameParts.filter(Boolean).join('__') + '.png';
            const folderPath = path.join(this.settings.outputDir, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            const filepath = path.join(folderPath, filename);
            await this.page.screenshot({ path: filepath, fullPage: true });
            const screenshotInfo = {
                name: filename.replace('.png',''),
                filename,
                folder,
                filepath,
                timestamp: new Date().toISOString(),
                size: fs.statSync(filepath).size,
                state: state ? state.name : undefined,
                details
            };
            this.screenshots.push(screenshotInfo);
            this.logger.info(`📸 Скриншот: ${filename}`);
            return filepath;
        } catch (error) {
            this.logger.error(`❌ Ошибка создания скриншота (auto-named): ${error.message}`);
            throw error;
        }
    }

    async executeActionWithVerification(action, expectedState, description = '', folder = 'states') {
        this.logger.info(`🎬 Выполнение действия: ${description}`);
        
        // Анализируем состояние до действия
        const beforeState = await this.analyzeScreenState(`before_${description.replace(/\s+/g, '_')}`, folder);
        
        // Проверяем, не находимся ли мы уже в ожидаемом состоянии
        if (beforeState.state.name === expectedState) {
            this.logger.info(`✅ Уже находимся в ожидаемом состоянии "${expectedState}"`);
            return { success: true, alreadyInState: true };
        }
        
        // Выполняем действие
        try {
            await action();
        } catch (error) {
            this.logger.error(`❌ Ошибка выполнения действия: ${error.message}`);
            throw error;
        }
        
        // Анализируем состояние после действия
        const afterState = await this.analyzeScreenState(`after_${description.replace(/\s+/g, '_')}`, folder);
        
        // Проверяем изменение состояния
        const stateChanged = beforeState.state.name !== afterState.state.name;
        const reachedExpectedState = afterState.state.name === expectedState;
        
        this.logger.info(`🔄 Состояние изменилось: ${stateChanged ? 'ДА' : 'НЕТ'}`);
        this.logger.info(`📊 ${beforeState.state.name} → ${afterState.state.name}`);
        this.logger.info(`🎯 Достигнуто ожидаемое состояние: ${reachedExpectedState ? 'ДА' : 'НЕТ'}`);
        
        if (reachedExpectedState) {
            this.logger.info(`✅ Действие выполнено успешно, достигнуто ожидаемое состояние`);
            return { success: true, stateChange: true, reachedExpected: true };
        } else if (stateChanged) {
            const error = `Действие выполнено, но достигнуто неожиданное состояние. Ожидалось: "${expectedState}", получено: "${afterState.state.name}"`;
            this.logger.error(`❌ ${error}`);
            throw new Error(error);
        } else {
            const error = `Действие выполнено, но состояние не изменилось. Текущее состояние: "${afterState.state.name}"`;
            this.logger.error(`❌ ${error}`);
            throw new Error(error);
        }
    }

    async runScenario(scenario) {
        this.logger.info(`🎬 Выполнение сценария: ${scenario.name} - ${scenario.description}`);
        
        try {
            // Анализируем начальное состояние
            await this.analyzeScreenState('initial', scenario.folder);
            
            // Выполняем действия сценария
            for (const action of scenario.actions) {
                await this.executeActionWithVerification(
                    () => this.clickByOCRCoordinates(action.buttonText, action.description),
                    action.expectedState,
                    action.description,
                    scenario.folder
                );
            }
            
            // Создаем финальный скриншот с именем сценария
            const finalState = await this.analyzeScreenState('final', scenario.folder);
            const finalScreenshotPath = await this.takeScreenshotAutoNamed(
                finalState.state, 
                scenario.name.replace('_', '__'), 
                scenario.folder
            );
            
            this.logger.info(`✅ Сценарий "${scenario.name}" выполнен успешно`);
            
        } catch (error) {
            this.logger.error(`❌ Ошибка в сценарии "${scenario.name}": ${error.message}`);
            this.errors.push({ 
                type: 'scenario_error', 
                scenario: scenario.name, 
                message: error.message 
            });
            
            // ПРЕРЫВАЕМ ВЫПОЛНЕНИЕ ПРИ ЛЮБОЙ ОШИБКЕ
            this.logger.error(`💥 Критическая ошибка - прерывание выполнения`);
            process.exit(1);
        }
    }

    async run() {
        const startTime = Date.now();
        
        try {
            await this.init();
            
            // Определяем сценарии
            const scenarios = [
                {
                    name: '01_initial_page',
                    description: 'Начальная страница приложения',
                    folder: 'states',
                    actions: []
                },
                {
                    name: '02_guest_mode',
                    description: 'Гостевой режим',
                    folder: 'scenarios/guest_login',
                    actions: [
                        {
                            buttonText: 'Продолжить как гость',
                            expectedState: 'main_app',
                            description: 'Клик по кнопке гостевого входа'
                        }
                    ]
                },
                {
                    name: '03_post_creation',
                    description: 'Создание поста',
                    folder: 'scenarios/post_creation',
                    actions: [
                        {
                            buttonText: 'Что у вас нового?',
                            expectedState: 'main_app',
                            description: 'Клик по полю создания поста'
                        }
                    ]
                },
                {
                    name: '04_menu_open',
                    description: 'Открытое главное меню',
                    folder: 'scenarios/menu_interaction',
                    actions: [
                        {
                            buttonText: 'Меню',
                            expectedState: 'main_app',
                            description: 'Клик по кнопке меню'
                        }
                    ]
                },
                {
                    name: '05_chat_open',
                    description: 'Открытый чат',
                    folder: 'scenarios/chat_interaction',
                    actions: [
                        {
                            buttonText: 'Чаты',
                            expectedState: 'main_app',
                            description: 'Клик по вкладке чатов'
                        }
                    ]
                }
            ];
            
            // Выполняем сценарии
            for (const scenario of scenarios) {
                await this.runScenario(scenario);
            }
            
            const duration = Date.now() - startTime;
            this.logger.info(`🎉 Модуль завершен за ${duration}ms`);
            this.logger.info(`📸 Создано скриншотов: ${this.screenshots.length}`);
            this.logger.info(`❌ Ошибок: ${this.errors.length}`);
            
        } catch (error) {
            this.logger.error(`💥 Критическая ошибка: ${error.message}`);
            this.errors.push({ type: 'critical_error', message: error.message });
            process.exit(1);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
        
        return {
            screenshots: this.screenshots,
            errors: this.errors,
            warnings: this.warnings
        };
    }
}

// CLI интерфейс
async function main() {
    const module = new AdvancedScreenshotModule();
    await module.run();
}

// Экспорт для использования как модуль
module.exports = AdvancedScreenshotModule;

// Запуск если файл вызван напрямую
if (require.main === module) {
    main().catch(error => {
        console.error(`💥 Критическая ошибка: ${error.message}`);
        process.exit(1);
    });
} 