const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

class SimpleScreenshotGenerator {
    constructor() {
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
            maxIterations: 10, // Максимальное количество итераций для предотвращения зацикливания
            maxTime: 300000 // 5 минут максимум
        };
        
        this.screenshots = [];
        this.errors = [];
        this.startTime = Date.now();
        this.iterationCount = 0;
        this.ocrCoordinates = null; // Добавляем OCR координаты
        this.lastScreenshotPath = null; // Путь к последнему скриншоту
        
        this.logger = {
            info: (msg) => {
                console.log(`[${new Date().toISOString()}] [INFO] ${msg}`);
                // Принудительно очищаем буфер
                if (process.stdout.write) {
                    process.stdout.write('');
                }
            },
            warn: (msg) => {
                console.log(`[${new Date().toISOString()}] [WARN] ${msg}`);
                if (process.stdout.write) {
                    process.stdout.write('');
                }
            },
            error: (msg) => {
                console.log(`[${new Date().toISOString()}] [ERROR] ${msg}`);
                if (process.stdout.write) {
                    process.stdout.write('');
                }
            },
            debug: (msg) => {
                console.log(`[${new Date().toISOString()}] [DEBUG] ${msg}`);
                if (process.stdout.write) {
                    process.stdout.write('');
                }
            }
        };
    }

    async checkTesseract() {
        try {
            this.logger.info('🔍 Проверка наличия Tesseract...');
            const version = execSync(`"${this.settings.tesseractPath}" --version`, { encoding: 'utf8', timeout: 5000 });
            this.logger.info(`✅ Tesseract найден: ${version.split('\n')[0]}`);
            return true;
        } catch (error) {
            const msg = `❌ Tesseract не найден: ${this.settings.tesseractPath}`;
            this.logger.error(msg);
            throw new Error(msg);
        }
    }

    async init() {
        this.logger.info('🚀 Инициализация простого генератора скриншотов...');
        await this.checkTesseract();
        
        // Загружаем OCR координаты
        await this.loadOCRCoordinates();
        
        this.browser = await puppeteer.launch({
            headless: this.settings.headless,
            defaultViewport: this.settings.viewport
        });
        
        this.page = await this.browser.newPage();
        let connected = false;
        let attempts = 0;
        while (!connected && attempts < 3) {
            this.checkForInfiniteLoop(); // Проверяем только при попытках подключения
            try {
                await this.page.goto(this.settings.baseUrl, { waitUntil: 'networkidle2' });
                connected = true;
            } catch (err) {
                this.logger.error(`❌ Ошибка подключения: ${err.message}`);
                if (attempts === 0) {
                    this.logger.info('🔄 Пытаюсь запустить серверы через start-servers-simple.ps1...');
                    try {
                        execSync('powershell -ExecutionPolicy Bypass -File start-servers-simple.ps1', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
                        this.logger.info('⏳ Жду 15 секунд для запуска серверов...');
                        await this.delay(15000);
                    } catch (e) {
                        this.logger.error('❌ Не удалось запустить start-servers-simple.ps1: ' + e.message);
                        throw e;
                    }
                } else {
                    this.logger.info(`⏳ Сервер не готов, повторная попытка через 15 секунд (попытка ${attempts+1}/3)...`);
                    await this.delay(15000);
                }
            }
            attempts++;
        }
        if (!connected) {
            throw new Error('Не удалось подключиться к серверу после 3 попыток.');
        }
        await this.delay(3000);
        this.logger.info('✅ Генератор инициализирован');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Проверка на зацикливание
    checkForInfiniteLoop() {
        this.iterationCount++;
        const elapsedTime = Date.now() - this.startTime;
        
        if (this.iterationCount > this.settings.maxIterations) {
            throw new Error(`💥 Обнаружено зацикливание: превышено максимальное количество итераций (${this.settings.maxIterations})`);
        }
        
        if (elapsedTime > this.settings.maxTime) {
            throw new Error(`💥 Превышено максимальное время выполнения (${this.settings.maxTime}ms)`);
        }
        
        this.logger.debug(`🔄 Итерация ${this.iterationCount}, время: ${elapsedTime}ms`);
    }

    async analyzePageState() {
        try {
            const pageInfo = await this.page.evaluate(() => {
                const info = {
                    title: document.title,
                    url: window.location.href,
                    modals: [],
                    buttons: [],
                    forms: [],
                    panels: [],
                    sidebars: [],
                    mainContent: [],
                    textElements: []
                };

                // Модальные окна
                const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]');
                modals.forEach(modal => {
                    const rect = modal.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        // Собираем все тексты кнопок внутри модального окна
                        const modalButtons = Array.from(modal.querySelectorAll('button, [role="button"]')).map(btn => btn.textContent?.trim() || '');
                        info.modals.push({
                            tagName: modal.tagName,
                            className: modal.className,
                            text: modal.textContent || '',
                            buttons: modalButtons,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Кнопки (всей страницы)
                const buttons = document.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
                buttons.forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.buttons.push({
                            text: btn.textContent?.trim() || '',
                            className: btn.className,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Панели
                const panels = document.querySelectorAll('[class*="panel"], [class*="card"], [class*="container"]');
                panels.forEach(panel => {
                    const rect = panel.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.panels.push({
                            tagName: panel.tagName,
                            className: panel.className,
                            text: panel.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Сайдбары
                const sidebars = document.querySelectorAll('[class*="sidebar"], [class*="nav"], [class*="menu"]');
                sidebars.forEach(sidebar => {
                    const rect = sidebar.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.sidebars.push({
                            tagName: sidebar.tagName,
                            className: sidebar.className,
                            text: sidebar.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Основной контент
                const mainContent = document.querySelectorAll('[class*="main"], [class*="content"], [class*="app"]');
                mainContent.forEach(content => {
                    const rect = content.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.mainContent.push({
                            tagName: content.tagName,
                            className: content.className,
                            text: content.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                // Текстовые элементы
                const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
                textElements.forEach(t => {
                    const rect = t.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.textElements.push({
                            tagName: t.tagName,
                            text: t.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                return info;
            });
            return pageInfo;
        } catch (error) {
            this.logger.error(`❌ Ошибка анализа состояния страницы: ${error.message}`);
            throw error;
        }
    }

    async extractTextWithOCR(imagePath) {
        try {
            const outputPath = path.join(path.dirname(imagePath), 'output');
            const command = `"${this.settings.tesseractPath}" "${imagePath}" "${outputPath}" -l rus+eng --oem 3 --psm 6 tsv`;
            
            this.logger.debug(`🔍 Запуск OCR: ${command}`);
            execSync(command, { timeout: 30000 });
            
            const tsvPath = outputPath + '.tsv';
            if (fs.existsSync(tsvPath)) {
                const tsvContent = fs.readFileSync(tsvPath, 'utf8');
                const lines = tsvContent.split('\n').filter(line => line.trim());
                const textElements = [];
                
                for (let i = 1; i < lines.length; i++) { // Пропускаем заголовок
                    const parts = lines[i].split('\t');
                    if (parts.length >= 12) {
                        const text = parts[11]?.trim();
                        if (text && text.length > 0) {
                            textElements.push({
                                text: text,
                                confidence: parseFloat(parts[10]) || 0,
                                x: parseInt(parts[6]) || 0,
                                y: parseInt(parts[7]) || 0,
                                width: parseInt(parts[8]) || 0,
                                height: parseInt(parts[9]) || 0
                            });
                        }
                    }
                }
                
                // Удаляем временный файл
                try { fs.unlinkSync(tsvPath); } catch (e) {}
                
                this.logger.debug(`📄 Извлечено ${textElements.length} текстовых элементов из OCR`);
                return textElements;
            }
            
            return [];
        } catch (error) {
            this.logger.error(`❌ Ошибка OCR: ${error.message}`);
            return [];
        }
    }

    determineState(domElements, ocrText) {
        const allText = ocrText.map(item => item.text).join(' ').toLowerCase();
        const hasModals = domElements.some(el => el.text.toLowerCase().includes('модальное') || el.text.toLowerCase().includes('modal'));
        const hasButtons = domElements.some(el => el.tagName === 'button');
        const hasPanels = domElements.some(el => el.text.toLowerCase().includes('панель') || el.text.toLowerCase().includes('panel'));
        const hasSidebars = domElements.some(el => el.text.toLowerCase().includes('боковая') || el.text.toLowerCase().includes('sidebar'));
        
        // Определяем состояние по содержимому
        if (allText.includes('войти') && allText.includes('гость')) {
            return { name: 'login_selection', description: 'Экран выбора способа входа' };
        }
        else if (allText.includes('email') || allText.includes('google')) {
            return { name: 'login_methods', description: 'Модальное окно выбора способа входа' };
        }
        else if (allText.includes('пост') && allText.includes('чат')) {
            return { name: 'main_app', description: 'Основное приложение' };
        }
        else if (hasModals && allText.includes('гость')) {
            return { name: 'guest_modal', description: 'Модальное окно гостевого входа' };
        }
        else if (hasSidebars && hasPanels) {
            return { name: 'app_with_sidebar', description: 'Приложение с боковой панелью' };
        }
        else if (hasModals) {
            return { name: 'modal_open', description: 'Открытое модальное окно' };
        }
        else {
            return { name: 'unknown_state', description: 'Неизвестное состояние' };
        }
    }

    async takeScreenshot(state, description, folder) {
        try {
            const folderPath = path.join(this.settings.outputDir, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${state.name}__${description.replace(/\s+/g, '_')}__${timestamp}.png`;
            const filepath = path.join(folderPath, filename);
            
            await this.page.screenshot({ path: filepath, fullPage: true });
            
            // Сохраняем путь к последнему скриншоту
            this.lastScreenshotPath = filepath;
            
            const screenshotInfo = {
                name: filename,
                path: filepath,
                state: state.name,
                description: state.description,
                folder: folder,
                timestamp: new Date().toISOString()
            };
            
            this.screenshots.push(screenshotInfo);
            this.logger.info(`📸 Скриншот: ${filename}`);
            
            return filepath;
        } catch (error) {
            this.logger.error(`❌ Ошибка создания скриншота: ${error.message}`);
            this.addError('Ошибка создания скриншота', error);
            throw error;
        }
    }

    async clickButton(buttonText) {
        try {
            // Сначала выведем все кнопки для отладки
            const allButtons = await this.page.evaluate(() => {
                const buttons = document.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
                return Array.from(buttons).map(btn => btn.textContent?.trim()).filter(text => text && text.length > 0);
            });
            this.logger.debug(`🔍 Найденные кнопки: ${allButtons.join(', ')}`);
            
            // Ищем кнопку по тексту содержимого (совместимо со всеми версиями Puppeteer)
            const button = await this.page.evaluateHandle((text) => {
                const selectors = ['button', '[role="button"]', '.btn', '[class*="button"]'];
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    for (const el of elements) {
                        const content = el.textContent?.trim() || '';
                        if (content.includes(text)) {
                            return el;
                        }
                    }
                }
                return null;
            }, buttonText);
            
            if (button && button.asElement()) {
                await button.click();
                this.logger.info(`✅ Клик по кнопке: ${buttonText}`);
                await this.delay(this.settings.delay);
                return true;
            } else {
                const error = `Критическая ошибка: Кнопка "${buttonText}" не найдена на странице`;
                this.logger.error(`❌ ${error}`);
                throw new Error(error);
            }
        } catch (error) {
            this.logger.error(`❌ Ошибка клика: ${error.message}`);
            throw error;
        }
    }

    async generateAllScreenshots(onScreenshot) {
        this.logger.info('🎬 Начинаем создание полной базы скриншотов с DOM и OCR анализом...');
        try {
            // 1. Начальная страница
            this.logger.info('📸 Скриншот начальной страницы...');
            const domElements1 = await this.getClickableElements();
            const tempScreenshot = path.join(this.settings.outputDir, 'temp', 'initial.png');
            fs.mkdirSync(path.dirname(tempScreenshot), { recursive: true });
            await this.page.screenshot({ path: tempScreenshot, fullPage: true });
            const ocrText1 = await this.extractTextWithOCR(tempScreenshot);
            const state1 = this.determineState(domElements1, ocrText1);
            await this.takeScreenshot(state1, 'initial_page', 'states');
            await this.validatePageContent(['войти в систему', 'продолжить как гость']);
            // 2. Гостевой вход
            this.logger.info('📸 Гостевой вход...');
            await this.clickByOCRCoordinates('Продолжить как гость', 'Клик по кнопке гостевого входа', onScreenshot);
            await this.delay(2000);
            const domElements2 = await this.getClickableElements();
            const guestScreenshot = path.join(this.settings.outputDir, 'temp', 'guest.png');
            await this.page.screenshot({ path: guestScreenshot, fullPage: true });
            const ocrText2 = await this.extractTextWithOCR(guestScreenshot);
            const state2 = this.determineState(domElements2, ocrText2);
            await this.takeScreenshot(state2, 'after_guest_login', 'scenarios/guest_login');
            this.validatePageContent(['что у вас нового', 'лента', 'посты'], 'Главная страница не загрузилась');
            this.logger.info(`✅ Главная страница загружена успешно`);

            // 3. Клик по профилю
            this.logger.info('📸 Профиль пользователя...');
            await this.clickIfNoModal('ПРОФИЛЬ_КНОПКА', 'Клик по кнопке профиля', onScreenshot);
            // Скриншот ПОСЛЕ клика для фиксации результата
            await this.delay(2000); // Ждём открытия профиля
            const domElements3 = await this.getClickableElements();
            const tempScreenshot3 = path.join(this.settings.outputDir, 'temp', 'profile.png');
            this.logger.info(`📸 Создаю скриншот профиля: ${tempScreenshot3}`);
            await this.page.screenshot({ path: tempScreenshot3, fullPage: true });
            
            // Проверяем что файл создался
            this.logger.info(`🔍 Проверяю существование файла: ${tempScreenshot3}`);
            this.logger.info(`🔍 Файл существует: ${fs.existsSync(tempScreenshot3)}`);
            if (!fs.existsSync(tempScreenshot3)) {
                throw new Error(`Скриншот профиля не создался: ${tempScreenshot3}`);
            }
            
            const ocrText3 = await this.extractTextWithOCR(tempScreenshot3);
            const state3 = this.determineState(domElements3, ocrText3);
            const safeDate = new Date().toISOString().replace(/:/g, '-');
            const screenshot3 = path.join(this.settings.outputDir, 'scenarios', 'profile', `main_app__profile_open__${safeDate}.png`);
            this.logger.info(`📸 Копирую файл: ${tempScreenshot3} -> ${screenshot3}`);
            fs.copyFileSync(tempScreenshot3, screenshot3);
            this.logger.info(`📸 Скриншот: ${path.basename(screenshot3)}`);
            this.validatePageContent(['профиль', 'настройки', 'выйти'], 'Профиль не открылся');
            this.logger.info(`✅ Профиль открыт успешно`);

            // 4. Клик по уведомлениям
            this.logger.info('📸 Уведомления...');
            await this.clickByOCRCoordinates('3', 'Клик по уведомлениям', onScreenshot);
            // Скриншот ПОСЛЕ клика для фиксации результата
            await this.delay(2000); // Ждём открытия уведомлений
            const domElements4 = await this.getClickableElements();
            const tempScreenshot4 = path.join(this.settings.outputDir, 'temp', 'notifications.png');
            await this.page.screenshot({ path: tempScreenshot4, fullPage: true });
            const ocrText4 = await this.extractTextWithOCR(tempScreenshot4);
            const state4 = this.determineState(domElements4, ocrText4);
            const safeDate4 = new Date().toISOString().replace(/:/g, '-');
            const screenshot4 = path.join(this.settings.outputDir, 'scenarios', 'notifications', `main_app__notifications_open__${safeDate4}.png`);
            // Создаём папку если её нет
            const notificationsDir = path.dirname(screenshot4);
            if (!fs.existsSync(notificationsDir)) {
                fs.mkdirSync(notificationsDir, { recursive: true });
            }
            fs.copyFileSync(tempScreenshot4, screenshot4);
            this.logger.info(`📸 Скриншот: ${path.basename(screenshot4)}`);
            this.validatePageContent(['уведомления', 'прочитано', 'очистить'], 'Уведомления не открылись');
            this.logger.info(`✅ Уведомления открыты успешно`);

            // 5. Создание поста
            this.logger.info('📸 Создание поста...');
            await this.clickByOCRCoordinates('Что у вас нового?', 'Клик по полю создания поста', onScreenshot);
            await this.delay(1000);
            const domElements5 = await this.getClickableElements();
            const postScreenshot = path.join(this.settings.outputDir, 'temp', 'post.png');
            await this.page.screenshot({ path: postScreenshot, fullPage: true });
            const ocrText5 = await this.extractTextWithOCR(postScreenshot);
            const state5 = this.determineState(domElements5, ocrText5);
            await this.takeScreenshot(state5, 'post_creation', 'scenarios/post_creation');
            this.validatePageContent(['что у вас нового', 'отправить'], 'Поле создания поста не открылось');
            this.logger.info(`✅ Поле создания поста открыто`);

            // 6. Главное меню
            this.logger.info('📸 Главное меню...');
            await this.clickByOCRCoordinates('3', 'Клик по кнопке главного меню', onScreenshot);
            await this.delay(1000);
            const domElements6 = await this.getClickableElements();
            const menuScreenshot = path.join(this.settings.outputDir, 'temp', 'menu.png');
            await this.page.screenshot({ path: menuScreenshot, fullPage: true });
            const ocrText6 = await this.extractTextWithOCR(menuScreenshot);
            const state6 = this.determineState(domElements6, ocrText6);
            await this.takeScreenshot(state6, 'menu_open', 'scenarios/menu_interaction');
            this.validatePageContent(['лента', 'избранное', 'ai-чаты'], 'Главное меню не открылось');
            this.logger.info(`✅ Главное меню открыто`);

            // 7. AI-чаты
            this.logger.info('📸 AI-чаты...');
            await this.clickByOCRCoordinates('AI-чаты', 'Клик по вкладке AI-чатов', onScreenshot);
            await this.delay(1000);
            const domElements7 = await this.getClickableElements();
            const chatScreenshot = path.join(this.settings.outputDir, 'temp', 'chat.png');
            await this.page.screenshot({ path: chatScreenshot, fullPage: true });
            const ocrText7 = await this.extractTextWithOCR(chatScreenshot);
            const state7 = this.determineState(domElements7, ocrText7);
            await this.takeScreenshot(state7, 'chat_open', 'scenarios/chat_interaction');
            this.validatePageContent(['ai-чаты', 'здравствуйте', 'чем могу помочь'], 'AI-чаты не открылись');
            this.logger.info(`✅ AI-чаты открыты успешно`);

            // Очищаем временные файлы
            const tempDir = path.join(this.settings.outputDir, 'temp');
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            this.logger.info('✅ Создание скриншотов завершено успешно!');
        } catch (error) {
            this.logger.error(`💥 Критическая ошибка: ${error.message}`);
            throw error;
        }
    }

    async run() {
        const startTime = Date.now();
        const allScreenshots = [];
        this.lastScreenshotPath = null;
        try {
            await this.init();
            await this.generateAllScreenshots((screenshotPath) => { this.lastScreenshotPath = screenshotPath; });
            const duration = Date.now() - startTime;
            this.logger.info(`🎉 Генератор завершен за ${duration}ms`);
            this.logger.info(`📸 Создано скриншотов: ${this.screenshots.length}`);
            this.logger.info(`❌ Ошибок: ${this.errors.length}`);
            if (allScreenshots.length > 0) {
                this.logger.info('📁 ПОЛНЫЙ СПИСОК СОЗДАННЫХ СКРИНШОТОВ:');
                allScreenshots.forEach((screenshotPath, index) => {
                    this.logger.info(`   ${index + 1}. ${screenshotPath}`);
                });
                this.logger.info(`📊 Всего файлов: ${allScreenshots.length}`);
            }
            if (this.errors.length > 0) {
                // ГАРАНТИРОВАННО: выводим массив ошибок полностью для отладки
                this.logger.error('DEBUG ERRORS: ' + JSON.stringify(this.errors, null, 2));
                this.logger.error('\n================ ОШИБКИ =================');
                this.errors.forEach((err, i) => {
                    this.logger.error(`\n❌ ОШИБКА #${i+1}: ${err.message || err}`);
                    if (err.screenshotPath) this.logger.error(`Скриншот с ошибкой: ${err.screenshotPath}`);
                    if (err.stack) this.logger.error(`Стек: ${err.stack}`);
                });
                this.logger.error('==========================================\n');
            }
            return {
                screenshots: this.screenshots,
                allScreenshots: allScreenshots,
                errors: this.errors,
                duration: duration
            };
        } catch (error) {
            if (!this.errors.length) {
                let errorScreenshotPath = this.lastScreenshotPath;
                try {
                    const errorPath = path.join(this.settings.outputDir, 'temp', `error_${Date.now()}.png`);
                    if (this.page) {
                        await this.page.screenshot({ path: errorPath, fullPage: true });
                        errorScreenshotPath = errorPath;
                        this.logger.error(`[ERROR_SCREENSHOT] ${errorScreenshotPath}`);
                    }
                } catch {}
                this.errors.push({ type: 'critical_error', message: error.message, stack: error.stack, screenshotPath: errorScreenshotPath });
            }
            this.logger.error('DEBUG ERRORS: ' + JSON.stringify(this.errors, null, 2));
            this.logger.error('\n================ ОШИБКИ =================');
            this.errors.forEach((err, i) => {
                this.logger.error(`\n❌ ОШИБКА #${i+1}: ${err.message || err}`);
                if (err.screenshotPath) this.logger.error(`Скриншот с ошибкой: ${err.screenshotPath}`);
                if (err.stack) this.logger.error(`Стек: ${err.stack}`);
            });
            this.logger.error('==========================================\n');
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
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

    async closeModalIfOpen() {
        // Проверяем наличие модального окна
        const modalSelector = '.MuiDialog-root, .modal, [role="dialog"]';
        const isModalOpen = await this.page.evaluate((selector) => {
            return !!document.querySelector(selector);
        }, modalSelector);
        if (!isModalOpen) return;
        this.logger.info('⚠️ Найдено открытое модальное окно. Пытаюсь закрыть...');
        // 1. Клик по крестику
        const closedByCross = await this.page.evaluate(() => {
            const cross = document.querySelector('.MuiDialog-root [aria-label="Close"], .modal [aria-label="Close"], [role="dialog"] [aria-label="Close"], .MuiDialog-root .MuiButtonBase-root, .modal .close, [role="dialog"] .close');
            if (cross) {
                cross.click();
                return true;
            }
            return false;
        });
        if (closedByCross) {
            this.logger.info('✅ Модальное окно закрыто по крестику.');
            await this.delay(700);
            return;
        }
        // 2. Клик по фону
        const closedByBackdrop = await this.page.evaluate(() => {
            const backdrop = document.querySelector('.MuiDialog-root .MuiBackdrop-root, .modal-backdrop, [role="dialog"] .backdrop');
            if (backdrop) {
                backdrop.click();
                return true;
            }
            return false;
        });
        if (closedByBackdrop) {
            this.logger.info('✅ Модальное окно закрыто по фону.');
            await this.delay(700);
            return;
        }
        // 3. Escape
        await this.page.keyboard.press('Escape');
        this.logger.info('✅ Модальное окно закрыто по Escape.');
        await this.delay(700);
    }

    async getClickableElements() {
        // Если есть открытое модальное окно — возвращаем только его кнопки
        const elements = await this.page.evaluate(() => {
            const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]');
            if (modals.length > 0) {
                // Берём первый открытый модал (или можно все)
                const modal = modals[0];
                const rect = modal.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const modalButtons = Array.from(modal.querySelectorAll('button, [role="button"]')).map(btn => {
                        const r = btn.getBoundingClientRect();
                        return {
                            tagName: btn.tagName,
                            text: btn.textContent?.trim() || '',
                            x: r.x,
                            y: r.y,
                            width: r.width,
                            height: r.height
                        };
                    });
                    return modalButtons;
                }
            }
            // Если модалки нет — возвращаем все кнопки страницы
            const clickableElements = [];
            const allElements = document.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
            allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    clickableElements.push({
                        tagName: el.tagName,
                        text: el.textContent?.trim() || '',
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    });
                }
            });
            return clickableElements;
        });
        return elements;
    }

    async clickByOCRCoordinates(buttonText, description = '', onScreenshot, expectModalToClose = false) {
        this.logger.info(`🔍 Полный анализ состояния перед кликом: "${buttonText}"`);
        // Проверяем наличие модального окна и логируем его заголовок/текст
        const modalInfo = await this.page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]');
            if (!modal) return null;
            let title = '';
            const titleEl = modal.querySelector('[role="heading"], .MuiDialogTitle-root, .modal-title, h2, h3, h4');
            if (titleEl) title = titleEl.textContent?.trim();
            let mainText = '';
            const mainTextEl = modal.querySelector('.MuiDialogContent-root, .modal-body, [role="document"]');
            if (mainTextEl) mainText = mainTextEl.textContent?.trim();
            // Собираем все кнопки
            const modalButtons = Array.from(modal.querySelectorAll('button, [role="button"]')).map(btn => btn.textContent?.trim() || '');
            return { title, mainText, modalButtons };
        });
        if (modalInfo) {
            this.logger.warn(`⚠️ Перед кликом обнаружено открытое модальное окно!`);
            if (modalInfo.title) this.logger.warn(`   Заголовок окна: "${modalInfo.title}"`);
            if (modalInfo.mainText) this.logger.warn(`   Основной текст: "${modalInfo.mainText.slice(0, 100)}..."`);
        }
        // Если кнопка есть в модалке — кликаем по ней, не закрывая модалку
        if (modalInfo && modalInfo.modalButtons && modalInfo.modalButtons.some(b => b && b.toLowerCase().includes(buttonText.toLowerCase()))) {
            this.logger.info(`🟦 Кликаем по кнопке "${buttonText}" внутри модального окна!`);
            const domElements = await this.getClickableElements();
            const button = domElements.find(coord => coord.text.toLowerCase().includes(buttonText.toLowerCase()));
            if (!button) {
                const error = `Кнопка "${buttonText}" не найдена среди кнопок модального окна`;
                this.addError(error);
                throw new Error(error);
            }
            await this.delay(500);
            const safeButtonText = buttonText.replace(/[<>:"/\\|?*]/g, '-');
            const beforeClickPath = path.join(this.settings.outputDir, 'temp', `before_click_${safeButtonText}_${Date.now()}.png`);
            await this.page.screenshot({ path: beforeClickPath, fullPage: true });
            if (onScreenshot) onScreenshot(beforeClickPath);
            this.lastScreenshotPath = beforeClickPath;
            this.logger.info(`📸 Скриншот перед кликом сохранен: ${beforeClickPath}`);
            this.logger.info(`🖱️ Клик по кнопке (модалка) по координатам (${button.x}, ${button.y})`);
            await this.page.mouse.click(button.x, button.y);
            this.logger.info(`✅ Клик выполнен по координатам (${button.x}, ${button.y})`);
            // Если ожидается, что модалка закроется — ждем её исчезновения
            if (expectModalToClose) {
                this.logger.info('⏳ Ожидание закрытия модального окна после клика...');
                await this.page.waitForFunction(() => {
                    return !document.querySelector('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]');
                }, { timeout: 10000 });
                this.logger.info('✅ Модальное окно исчезло после клика.');
            }
            return;
        }
        // Если кнопки нет в модалке — закрываем модалку и ищем по всей странице
        if (modalInfo) {
            this.logger.info('⚠️ Кнопка не найдена в модалке, закрываю модальное окно...');
            await this.closeModalIfOpen();
        }
        // 1. DOM анализ
        const domElements = await this.getClickableElements();
        // 2. OCR анализ и прочее (оставляем как было)
        // ... (оставить остальной код без изменений) ...
        // Обычный поиск по тексту
        const button = domElements.find(coord => coord.text.toLowerCase().includes(buttonText.toLowerCase()));
        if (!button) {
            const error = `Кнопка "${buttonText}" не найдена среди DOM-координат`;
            this.addError(error);
            throw new Error(error);
        }
        this.logger.info(`📍 Найдена кнопка "${button.text}" в точке (${button.x}, ${button.y})`);
        await this.delay(500);
        const safeButtonText = buttonText.replace(/[<>:"/\\|?*]/g, '-');
        const beforeClickPath = path.join(this.settings.outputDir, 'temp', `before_click_${safeButtonText}_${Date.now()}.png`);
        await this.page.screenshot({ path: beforeClickPath, fullPage: true });
        if (onScreenshot) onScreenshot(beforeClickPath);
        this.lastScreenshotPath = beforeClickPath;
        this.logger.info(`📸 Скриншот перед кликом сохранен: ${beforeClickPath}`);
        this.logger.info(`🖱️ Клик по кнопке (DOM) по координатам (${button.x}, ${button.y})`);
        await this.page.mouse.click(button.x, button.y);
        this.logger.info(`✅ Клик выполнен по координатам (${button.x}, ${button.y})`);
        return;
    }

    async validatePageContent(expectedTexts, errorMessage = 'Неизвестная ошибка') {
        // 1. Проверяем состояние страницы
        const pageInfo = await this.analyzePageState();
        
        // 2. Собираем все тексты со страницы И из модальных окон
        let actualTexts = [
            ...pageInfo.buttons.map(b => b.text),
            ...pageInfo.panels.map(p => p.text),
            ...pageInfo.sidebars.map(s => s.text),
            ...pageInfo.mainContent.map(c => c.text),
            ...pageInfo.textElements.map(t => t.text)
        ];
        
        // 3. Добавляем тексты из модальных окон
        if (pageInfo.modals && pageInfo.modals.length > 0) {
            this.logger.info('🔍 Проверяю элементы внутри модального окна...');
            pageInfo.modals.forEach(modal => {
                if (modal.text) actualTexts.push(modal.text);
                if (modal.buttons) actualTexts.push(...modal.buttons);
            });
        }
        
        // 4. Нормализуем тексты для поиска
        const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const missingTexts = expectedTexts.filter(t => !actualTexts.some(a => norm(a).includes(norm(t))));
        
        if (missingTexts.length > 0) {
            // Если элементы не найдены, но есть модальное окно — попробуем закрыть его и поискать снова
            if (pageInfo.modals && pageInfo.modals.length > 0) {
                this.logger.warn('⚠️ Элементы не найдены в модальном окне, пытаюсь закрыть модалку и поискать на фоне...');
                await this.closeModalIfOpen();
                await this.delay(1000);
                
                // Повторная проверка после закрытия модалки
                const pageInfoAfter = await this.analyzePageState();
                let actualTextsAfter = [
                    ...pageInfoAfter.buttons.map(b => b.text),
                    ...pageInfoAfter.panels.map(p => p.text),
                    ...pageInfoAfter.sidebars.map(s => s.text),
                    ...pageInfoAfter.mainContent.map(c => c.text),
                    ...pageInfoAfter.textElements.map(t => t.text)
                ];
                
                const missingTextsAfter = expectedTexts.filter(t => !actualTextsAfter.some(a => norm(a).includes(norm(t))));
                if (missingTextsAfter.length > 0) {
                    const error = `${errorMessage}: Не найдены следующие элементы (ни в модалке, ни на фоне): ${missingTextsAfter.join(', ')}`;
                    this.addError(error);
                    throw new Error(error);
                }
            } else {
                const error = `${errorMessage}: Не найдены следующие элементы: ${missingTexts.join(', ')}`;
                this.addError(error);
                throw new Error(error);
            }
        }
        
        this.logger.info(`✅ Страница содержит все необходимые элементы`);
        return;
    }

    // Функция для показа Windows уведомления
    showWindowsNotification(title, message, screenshotPath = null) {
        if (process.stdout.write) {
            process.stdout.write('');
        }
        this.logger.info(`📢 Показываю Windows уведомление: ${title}`);
        try {
            const encodedTitle = Buffer.from(title, 'utf8').toString('base64');
            let fullMessage = message;
            let encodedScreenshot = '';
            let absPath = '';
            if (screenshotPath) {
                absPath = path.resolve(screenshotPath);
                fullMessage += `\n\nПуть к скриншоту (скопирован в буфер):\n${absPath}`;
                encodedScreenshot = Buffer.from(absPath, 'utf8').toString('base64');
            }
            const encodedMessage = Buffer.from(fullMessage, 'utf8').toString('base64');
            const psScript = `
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms
$title = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedTitle}'))
$message = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedMessage}'))
` + (screenshotPath ? `$clip = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedScreenshot}'))
[System.Windows.Forms.Clipboard]::SetText($clip)
` : '') + `$result = [System.Windows.MessageBox]::Show($message, $title, 'OK', 'Information')
Write-Host "Notification shown: $result"
`;
            const tempFile = path.join(this.settings.outputDir, `notification_${Date.now()}.ps1`);
            const dir = path.dirname(tempFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(tempFile, psScript, 'utf8');
            execSync(`powershell -ExecutionPolicy Bypass -File "${tempFile}"`, { stdio: 'inherit', timeout: 10000 });
            try { fs.unlinkSync(tempFile); } catch (e) {}
        } catch (error) {
            this.logger.error(`❌ Ошибка при показе уведомления Windows: ${error.message}`);
            try {
                const cmdScript = `msg %username% "${title}: ${message}"`;
                execSync(cmdScript, { stdio: 'inherit' });
                this.logger.info('📢 Уведомление отправлено через cmd');
            } catch (cmdError) {
                this.logger.error(`❌ Не удалось отправить уведомление: ${cmdError.message}`);
                console.log('\n' + '='.repeat(60));
                console.log(`🚨 ВАЖНОЕ УВЕДОМЛЕНИЕ: ${title}`);
                console.log('='.repeat(60));
                console.log(message);
                if (screenshotPath) console.log('Путь к скриншоту:', path.resolve(screenshotPath));
                console.log('='.repeat(60) + '\n');
            }
        }
    }

    // Функция для добавления ошибки с уведомлением
    addError(description, error = null) {
        const errorInfo = {
            description,
            screenshotPath: this.lastScreenshotPath,
            timestamp: new Date().toISOString(),
            stack: error ? error.stack : null
        };
        this.errors.push(errorInfo);
        this.logger.error(`❌ Ошибка: ${description}`);
        // Показываем Windows уведомление
        const notificationTitle = `Ошибка автоматизации #${this.errors.length}`;
        const notificationMessage = `${description}`;
        this.showWindowsNotification(notificationTitle, notificationMessage, this.lastScreenshotPath);
    }

    // Функция для обработки всех ошибок в конце выполнения
    handleFinalErrors() {
        if (this.errors.length > 0) {
            console.log('\n=== ОШИБКИ ВЫПОЛНЕНИЯ ===');
            console.log(`Найдено ошибок: ${this.errors.length}`);
            this.errors.forEach((error, index) => {
                console.log(`\nОшибка ${index + 1}:`);
                console.log(`Описание: ${error.description || error.message}`);
                console.log(`Скриншот: ${error.screenshotPath}`);
                console.log(`Время: ${error.timestamp || 'Не указано'}`);
                if (error.stack) {
                    console.log(`Стек вызовов: ${error.stack}`);
                }
                console.log('---');
            });
            console.log('\n=== КОНЕЦ ОТЧЕТА ОБ ОШИБКАХ ===');
            // Показываем итоговое уведомление
            const finalTitle = `Завершение автоматизации - ${this.errors.length} ошибок`;
            const finalMessage = `Найдено ${this.errors.length} ошибок.\n\nПроверьте консоль для детальной информации.\n\nСкриншоты ошибок сохранены в: ${this.settings.outputDir}`;
            // Передаем путь к последнему скриншоту, если есть
            const lastError = this.errors[this.errors.length - 1];
            this.showWindowsNotification(finalTitle, finalMessage, lastError && lastError.screenshotPath);
            return false;
        }
        return true;
    }

    async isModalOpen() {
        return await this.page.evaluate(() => {
            return !!document.querySelector('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"]');
        });
    }

    async clickIfNoModal(buttonText, description = '', onScreenshot) {
        // Проверяем состояние
        const pageInfo = await this.analyzePageState();
        if (pageInfo.modals && pageInfo.modals.length > 0) {
            this.logger.warn('❌ Модальное окно всё ещё открыто, клик невозможен!');
            throw new Error('Модальное окно не закрыто, клик невозможен');
        }
        // Кликаем по элементу на фоне
        await this.clickByOCRCoordinates(buttonText, description, onScreenshot);
    }
}

module.exports = SimpleScreenshotGenerator;