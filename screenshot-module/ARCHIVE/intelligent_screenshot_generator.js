const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Intelligent Screenshot Generator
 * Интегрирует лучшие практики из OCR/DOM ботов для создания качественной документации
 */
class IntelligentScreenshotGenerator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.baseDir = 'documentation_screenshots';
        this.stepCounter = 0;
        this.currentScenario = '';
        this.currentPanel = '';
        
        // Создаем базовую структуру папок
        this.ensureDirectoryStructure();
    }

    /**
     * Создает структуру папок согласно лучшим практикам
     */
    ensureDirectoryStructure() {
        const directories = [
            this.baseDir,
            path.join(this.baseDir, 'scenarios'),
            path.join(this.baseDir, 'panels'),
            path.join(this.baseDir, 'errors'),
            path.join(this.baseDir, 'logs')
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Создана папка: ${dir}`);
            }
        });
    }

    /**
     * Инициализация браузера
     */
    async init() {
        console.log('🚀 Инициализация Intelligent Screenshot Generator...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox', '--disable-web-security']
        });
        
        this.page = await this.browser.newPage();
        
        // Устанавливаем таймауты
        this.page.setDefaultTimeout(30000);
        this.page.setDefaultNavigationTimeout(30000);
        
        console.log('✅ Браузер инициализирован');
    }

    /**
     * Универсальная пауза с логированием
     */
    async pause(duration = 2000, reason = '') {
        const reasonText = reason ? ` (${reason})` : '';
        console.log(`⏱️ Пауза ${duration}ms${reasonText}`);
        await new Promise(resolve => setTimeout(resolve, duration));
    }

    /**
     * Анализ DOM структуры страницы
     */
    async analyzeDOM() {
        console.log('🔍 Анализ DOM структуры...');
        
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
                    sidebarElements: [],
                    navigationElements: []
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
                        
                        // Специально ищем кнопки email
                        if (buttonText.toLowerCase().includes('email') || 
                            ariaLabel.toLowerCase().includes('email') ||
                            buttonText.toLowerCase().includes('почта')) {
                            info.emailButtons.push({
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
                            method: form.method,
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Ищем элементы навигации
                const navElements = document.querySelectorAll('nav, [role="navigation"], .navbar, .sidebar, [class*="nav"]');
                navElements.forEach(nav => {
                    const rect = nav.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.navigationElements.push({
                            tagName: nav.tagName,
                            className: nav.className,
                            id: nav.id,
                            text: nav.textContent?.substring(0, 200),
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                return info;
            });

            console.log(`📊 DOM анализ завершен: ${domInfo.buttons.length} кнопок, ${domInfo.modals.length} модалок, ${domInfo.forms.length} форм`);
            return domInfo;
        } catch (error) {
            console.error('❌ Ошибка анализа DOM:', error.message);
            return null;
        }
    }

    /**
     * Извлечение текста из изображения через OCR с улучшенными параметрами
     */
    async extractTextFromImage(imagePath) {
        return new Promise((resolve, reject) => {
            // Улучшенные параметры Tesseract для лучшего распознавания
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng --oem 3 --psm 6 tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Ошибка Tesseract:', error.message);
                    reject(error);
                    return;
                }

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

                        if (text && conf > 30) { // Увеличиваем минимальный порог уверенности
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

    /**
     * Комплексный анализ состояния экрана (DOM + OCR)
     */
    async analyzeScreenState(description = '') {
        console.log(`🔍 Комплексный анализ состояния экрана: ${description}`);
        
        // Сначала делаем скриншот
        const screenshotPath = await this.takeScreenshot(`analyze_${description.replace(/\s+/g, '_')}`);
        
        // Анализируем DOM
        const domInfo = await this.analyzeDOM();
        
        // Извлекаем текст через OCR
        const ocrText = await this.extractTextFromImage(screenshotPath);
        
        // Определяем состояние на основе DOM и OCR
        const state = this.determineScreenState(ocrText, domInfo);
        
        console.log(`📊 Определено состояние: ${state.name}`);
        console.log(`📝 Описание: ${state.description}`);
        console.log(`🔍 Признаки: ${state.indicators.join(', ')}`);
        
        return {
            state: state,
            ocrText: ocrText,
            domInfo: domInfo,
            screenshotPath: screenshotPath
        };
    }

    /**
     * Определение состояния экрана на основе DOM и OCR данных
     */
    determineScreenState(ocrText, domInfo) {
        const allText = ocrText.map(item => item.text.toLowerCase()).join(' ');
        
        // Проверяем различные состояния
        if (allText.includes('войти') || allText.includes('login') || allText.includes('вход')) {
            return {
                name: 'login_selection',
                description: 'Страница выбора метода входа',
                indicators: ['кнопки входа', 'выбор метода', 'авторизация']
            };
        }
        
        if (allText.includes('гость') || allText.includes('guest')) {
            return {
                name: 'guest_login_available',
                description: 'Доступен гостевой вход',
                indicators: ['кнопка гостя', 'продолжить как гость']
            };
        }
        
        if (allText.includes('пост') || allText.includes('post') || allText.includes('создать')) {
            return {
                name: 'main_app',
                description: 'Основное приложение с постами',
                indicators: ['лента постов', 'создание постов', 'основной интерфейс']
            };
        }
        
        if (allText.includes('чат') || allText.includes('chat') || allText.includes('сообщение')) {
            return {
                name: 'chat_interface',
                description: 'Интерфейс чата',
                indicators: ['сообщения', 'чат', 'диалоги']
            };
        }
        
        if (allText.includes('профиль') || allText.includes('profile') || allText.includes('пользователь')) {
            return {
                name: 'user_profile',
                description: 'Профиль пользователя',
                indicators: ['информация пользователя', 'профиль', 'настройки']
            };
        }
        
        return {
            name: 'unknown_state',
            description: 'Неизвестное состояние',
            indicators: ['неопределенное состояние']
        };
    }

    /**
     * Умный клик только по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ" с ожиданием исчезновения модалки
     */
    async smartClickGuestButton(description = '') {
        console.log(`🎯 Умный клик: "ПРОДОЛЖИТЬ КАК ГОСТЬ" ${description}`);
        // Анализируем состояние до клика
        const beforeState = await this.analyzeScreenState('before_click');
        
        // Пробуем найти кнопку через DOM (по тексту)
        try {
            // Проверяем, что this.page - это полноценный Puppeteer Page
            if (!this.page || typeof this.page.evaluate !== 'function') {
                console.error('❌ this.page не является Puppeteer Page! Тип:', typeof this.page);
                throw new Error('this.page не является Puppeteer Page');
            }
            
            // Ищем кнопку через evaluate
            const buttonFound = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"]'));
                for (const button of buttons) {
                    const text = button.textContent?.trim() || '';
                    if (text.toLowerCase().includes('продолжить') || text.toLowerCase().includes('гость')) {
                        return {
                            found: true,
                            text: text,
                            className: button.className,
                            id: button.id
                        };
                    }
                }
                return { found: false };
            });
            
            if (buttonFound.found) {
                console.log(`✅ Найдена кнопка через DOM: "${buttonFound.text}"`);
                
                // Кликаем через evaluate
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"]'));
                    for (const button of buttons) {
                        const text = button.textContent?.trim() || '';
                        if (text.toLowerCase().includes('продолжить') || text.toLowerCase().includes('гость')) {
                            button.click();
                            return true;
                        }
                    }
                    return false;
                });
                
                console.log('✅ DOM клик выполнен');
                
                // Ждем исчезновения модалки
                try {
                    await this.page.waitForSelector('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]', { hidden: true, timeout: 5000 });
                } catch (e) {
                    console.log('⚠️ Модалка не исчезла, но продолжаем...');
                }
                
                // Анализируем состояние после клика
                const afterState = await this.analyzeScreenState('after_click');
                const stateChanged = beforeState.state.name !== afterState.state.name;
                return { success: true, method: 'DOM', stateChange: stateChanged, afterState };
            } else {
                console.log('❌ Кнопка не найдена через DOM');
            }
        } catch (error) {
            console.error('❌ Ошибка DOM клика:', error.message);
        }
        
        // Если не найдено — fallback на OCR
        console.log('🔍 DOM не нашел кнопку, пробуем через OCR');
        const screenshotPath = await this.takeScreenshot('search_guest_button');
        
        // Извлекаем весь текст через OCR
        const ocrText = await this.extractTextFromImage(screenshotPath);
        const allText = ocrText.map(item => item.text).join(' ').replace(/\s+/g, ' ');
        console.log('📝 Весь текст, найденный Tesseract:', allText);
        
        // Ищем блоки с "продолжить" или "гость"
        const coords = ocrText.filter(item => {
            const text = item.text?.toLowerCase() || '';
            return text.includes('продолжить') || text.includes('гость');
        });
        
        if (coords.length > 0) {
            console.log(`🎯 Найдено ${coords.length} элементов через OCR:`);
            coords.forEach((item, index) => {
                console.log(`  ${index + 1}. "${item.text}" (уверенность: ${item.confidence}%, координаты: ${item.centerX}, ${item.centerY})`);
            });
            
            // Ищем кнопку "продолжить как гость" - ищем слова рядом
            let target = null;
            
            // Сначала ищем "продолжить"
            const continueElement = coords.find(item => item.text.toLowerCase().includes('продолжить'));
            if (continueElement) {
                console.log(`✅ Найдено "продолжить" по координатам (${continueElement.centerX}, ${continueElement.centerY})`);
                target = continueElement;
            } else {
                // Если не нашли "продолжить", берем "гость"
                const guestElement = coords.find(item => item.text.toLowerCase().includes('гость'));
                if (guestElement) {
                    console.log(`✅ Найдено "гость" по координатам (${guestElement.centerX}, ${guestElement.centerY})`);
                    target = guestElement;
                }
            }
            
            if (target) {
                console.log(`🎯 Кликаем по "${target.text}" (уверенность: ${target.confidence}%)`);
                await this.page.mouse.click(target.centerX, target.centerY);
                console.log(`🖱️ OCR клик по координатам (${target.centerX}, ${target.centerY})`);
                
                // Ждем исчезновения модалки
                try {
                    await this.page.waitForSelector('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]', { hidden: true, timeout: 5000 });
                } catch (e) {
                    console.log('⚠️ Модалка не исчезла, но продолжаем...');
                }
                
                const afterState = await this.analyzeScreenState('after_click');
                const stateChanged = beforeState.state.name !== afterState.state.name;
                return { success: true, method: 'OCR', stateChange: stateChanged, afterState };
            }
        } else {
            console.log('❌ OCR не нашёл кнопку с "продолжить" или "гость"');
        }
        
        return { success: false, reason: 'button_not_found', ocrText: allText };
    }

    /**
     * Клик через DOM
     */
    async clickViaDOM(searchText, description = '') {
        console.log(`🔍 Поиск элемента через DOM: "${searchText}"`);
        
        try {
            // Ищем элемент по тексту
            const element = await this.page.evaluateHandle((text) => {
                const elements = Array.from(document.querySelectorAll('*'));
                return elements.find(el => {
                    const elementText = el.textContent?.trim() || '';
                    const ariaLabel = el.getAttribute('aria-label') || '';
                    return elementText.toLowerCase().includes(text.toLowerCase()) ||
                           ariaLabel.toLowerCase().includes(text.toLowerCase());
                });
            }, searchText);
            
            if (element) {
                await element.click();
                console.log(`✅ DOM клик выполнен`);
                return { success: true, method: 'DOM' };
            }
            
            return { success: false, method: 'DOM', reason: 'element_not_found' };
        } catch (error) {
            console.error('❌ Ошибка DOM клика:', error.message);
            return { success: false, method: 'DOM', reason: error.message };
        }
    }

    /**
     * Клик через OCR координаты
     */
    async clickViaOCR(searchText, description = '') {
        console.log(`🔍 Поиск элемента через OCR: "${searchText}"`);
        
        try {
            // Делаем скриншот для поиска
            const screenshotPath = await this.takeScreenshot(`search_${searchText.replace(/\s+/g, '_')}`);
            
            // Ищем текст через OCR
            const coords = await this.findTextCoordinates(screenshotPath, searchText);
            
            if (coords.length === 0) {
                console.log(`❌ Текст "${searchText}" не найден через OCR`);
                return { success: false, method: 'OCR', reason: 'text_not_found' };
            }

            // Берем первый найденный элемент
            const target = coords[0];
            console.log(`✅ Найдено "${target.text}" (conf: ${target.confidence}%)`);
            console.log(`📍 Координаты: (${target.centerX}, ${target.centerY})`);

            // Кликаем по центру элемента
            await this.page.mouse.click(target.centerX, target.centerY);
            console.log(`🖱️ OCR клик выполнен`);
            
            return { success: true, method: 'OCR' };
        } catch (error) {
            console.error('❌ Ошибка OCR клика:', error.message);
            return { success: false, method: 'OCR', reason: error.message };
        }
    }

    /**
     * Поиск координат текста через OCR с улучшенными параметрами
     */
    async findTextCoordinates(imagePath, searchText) {
        return new Promise((resolve, reject) => {
            // Улучшенные параметры Tesseract для лучшего распознавания
            const command = `${this.tesseractPath} "${imagePath}" output -l rus+eng --oem 3 --psm 6 tsv`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Ошибка Tesseract:', error.message);
                    reject(error);
                    return;
                }

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

                        if (text && text.toLowerCase().includes(searchText.toLowerCase()) && conf > 30) {
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

    /**
     * Создание скриншота с правильной структурой папок и высоким качеством
     */
    async takeScreenshot(name, options = {}) {
        this.stepCounter++;
        
        // Определяем путь для сохранения
        let filepath;
        if (this.currentScenario && this.currentPanel) {
            filepath = path.join(this.baseDir, 'scenarios', this.currentScenario, this.currentPanel, `${this.stepCounter.toString().padStart(2, '0')}_${name}.png`);
        } else if (this.currentScenario) {
            filepath = path.join(this.baseDir, 'scenarios', this.currentScenario, `${this.stepCounter.toString().padStart(2, '0')}_${name}.png`);
        } else {
            filepath = path.join(this.baseDir, `${this.stepCounter.toString().padStart(2, '0')}_${name}.png`);
        }
        
        // Создаем папки если их нет
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Настройки для высокого качества скриншота
        const screenshotOptions = {
            path: filepath,
            fullPage: true,
            // Увеличиваем разрешение для лучшего OCR
            deviceScaleFactor: 2, // 2x увеличение разрешения
            // Дополнительные параметры для качества
            omitBackground: false,
            ...options
        };
        
        // Делаем скриншот с высоким качеством
        await this.page.screenshot(screenshotOptions);
        
        console.log(`📸 Высококачественный скриншот сохранен: ${filepath} (2x разрешение)`);
        return filepath;
    }

    /**
     * Установка текущего сценария
     */
    setScenario(scenarioName) {
        this.currentScenario = scenarioName;
        console.log(`📋 Установлен сценарий: ${scenarioName}`);
    }

    /**
     * Установка текущей панели
     */
    setPanel(panelName) {
        this.currentPanel = panelName;
        console.log(`📋 Установлена панель: ${panelName}`);
    }

    /**
     * Навигация на страницу
     */
    async navigateTo(url) {
        console.log(`🌐 Переход на: ${url}`);
        try {
            await this.page.goto(url, { waitUntil: 'networkidle2' });
            await this.pause(2000, 'после загрузки страницы');
            console.log(`✅ Страница загружена`);
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы: ${error.message}`);
            throw error;
        }
    }

    /**
     * Обработка ошибок с сохранением скриншота
     */
    async handleError(error, context, additionalInfo = {}) {
        console.error(`❌ Ошибка в ${context}: ${error}`);
        
        // Сохраняем скриншот ошибки
        const errorScreenshot = path.join(this.baseDir, 'errors', `error_${Date.now()}.png`);
        await this.page.screenshot({ path: errorScreenshot, fullPage: true });
        
        // Сохраняем информацию об ошибке
        const errorInfo = {
            timestamp: new Date().toISOString(),
            error: error.message || error,
            context: context,
            scenario: this.currentScenario,
            panel: this.currentPanel,
            step: this.stepCounter,
            screenshot: errorScreenshot,
            ...additionalInfo
        };
        
        const errorLogPath = path.join(this.baseDir, 'logs', `error_${Date.now()}.json`);
        fs.writeFileSync(errorLogPath, JSON.stringify(errorInfo, null, 2));
        
        console.log(`📸 Скриншот ошибки сохранен: ${errorScreenshot}`);
        console.log(`📝 Лог ошибки сохранен: ${errorLogPath}`);
        
        throw new Error(`Ошибка в ${context}: ${error.message || error}`);
    }

    /**
     * Закрытие браузера
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }
}

module.exports = IntelligentScreenshotGenerator; 