const puppeteer = require('puppeteer');
const tesseract = require('node-tesseract-ocr');
const FinalStateAnalyzer = require('./final_state_analyzer');

class FinalOCRBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.analyzer = new FinalStateAnalyzer();
        this.baseUrl = 'http://localhost:3000';
        this.screenshotsDir = 'test_screenshots/final_bot';
        this.logs = [];
        this.errors = [];
        this.lastScreenshotPath = null;
        
        // Документация состояний
        this.stateDocumentation = {
            'guest_mode': {
                name: 'Гостевой режим',
                confidence: 0,
                indicators: ['Онлайн', 'Нравится', 'Отправить', 'Что у вас нового?'],
                actions: ['create_post', 'like_post', 'send_message', 'open_menu'],
                elements: {
                    'create_post_field': 'Что у вас нового?',
                    'like_button': 'Нравится',
                    'send_button': 'ОТПРАВИТЬ',
                    'online_status': 'Онлайн',
                    'search_icon': 'SearchIcon',
                    'chat_icon': 'SmartToyIcon'
                }
            },
            'create_post': {
                name: 'Создание поста',
                confidence: 0,
                indicators: ['Что у вас нового?', 'ОТПРАВИТЬ'],
                actions: ['write_post', 'publish_post', 'cancel_post'],
                elements: {
                    'post_field': 'Что у вас нового?',
                    'send_button': 'ОТПРАВИТЬ'
                }
            },
            'chat': {
                name: 'Чат',
                confidence: 0,
                indicators: ['AI-чаты', 'Чаты', 'Здравствуйте! Чем могу помочь?'],
                actions: ['send_message', 'close_chat'],
                elements: {
                    'greeting': 'Здравствуйте! Чем могу помочь?',
                    'chat_title': 'AI-чаты'
                }
            }
        };
    }

    async init() {
        console.log('🚀 Инициализация финального OCR бота...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Создаем директории
        this.createDirectories();
        
        console.log('✅ OCR бот инициализирован');
    }

    createDirectories() {
        const dirs = [
            this.screenshotsDir,
            `${this.screenshotsDir}/errors`,
            `${this.screenshotsDir}/success`
        ];
        
        dirs.forEach(dir => {
            if (!require('fs').existsSync(dir)) {
                require('fs').mkdirSync(dir, { recursive: true });
            }
        });
    }

    async pause(ms = 2000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message };
        this.logs.push(logEntry);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    async takeScreenshot(filename, description = '') {
        const filepath = `${this.screenshotsDir}/${filename}`;
        await this.page.screenshot({ 
            path: filepath, 
            fullPage: true 
        });
        this.log(`📸 ${description} -> ${filepath}`);
        this.lastScreenshotPath = filepath;
        return filepath;
    }

    // Функция для показа Windows уведомления
    showWindowsNotification(title, message) {
        // Используем более безопасный способ с временным файлом
        const tempFile = `${this.screenshotsDir}/notification_${Date.now()}.ps1`;
        const psScript = `
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show('${message.replace(/'/g, "''")}', '${title.replace(/'/g, "''")}', 'OK', 'Information')
`;
        
        try {
            require('fs').writeFileSync(tempFile, psScript, 'utf8');
            const { exec } = require('child_process');
            exec(`powershell -ExecutionPolicy Bypass -File "${tempFile}"`, (error, stdout, stderr) => {
                // Удаляем временный файл
                try {
                    require('fs').unlinkSync(tempFile);
                } catch (e) {
                    // Игнорируем ошибки удаления
                }
                
                if (error) {
                    console.log('Ошибка при показе уведомления Windows:', error.message);
                }
            });
        } catch (error) {
            console.log('Ошибка при создании уведомления:', error.message);
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
        this.log(`❌ Ошибка: ${description}`, 'error');
        
        // Показываем Windows уведомление
        const notificationTitle = `Ошибка автоматизации #${this.errors.length}`;
        const notificationMessage = `${description}\n\nСкриншот: ${this.lastScreenshotPath || 'Не создан'}`;
        this.showWindowsNotification(notificationTitle, notificationMessage);
    }

    async analyzeCurrentState() {
        try {
            this.log('🔍 Анализ текущего состояния...');
            
            // Используем финальный анализатор
            const state = await this.analyzer.analyzeState(this.page);
            
            this.log(`🎯 Определено состояние: ${state.name} (${Math.round(state.confidence * 100)}%)`);
            
            if (state.confidence < 0.7) {
                this.log(`⚠️ Низкая уверенность в определении состояния: ${state.confidence}`, 'warning');
            }
            
            return state;
            
        } catch (error) {
            this.log(`❌ Ошибка при анализе состояния: ${error.message}`, 'error');
            this.addError('Ошибка при анализе состояния', error);
            return {
                name: 'Ошибка анализа',
                confidence: 0,
                actions: ['check_connection']
            };
        }
    }

    async findElementByText(searchText, timeout = 10000) {
        try {
            this.log(`🔍 Поиск элемента с текстом: "${searchText}"`);
            
            // Используем page.evaluate для поиска элементов с текстом
            const elementInfo = await this.page.evaluate((text) => {
                const elements = document.querySelectorAll('button, a, span, div, p, h1, h2, h3, h4, h5, h6');
                for (const element of elements) {
                    if (element.textContent && element.textContent.includes(text)) {
                        const rect = element.getBoundingClientRect();
                        const isVisible = !!(element.offsetParent || rect.width > 0 || rect.height > 0);
                        
                        if (isVisible) {
                            return {
                                text: element.textContent.trim(),
                                x: rect.x + rect.width / 2,
                                y: rect.y + rect.height / 2,
                                tagName: element.tagName.toLowerCase(),
                                className: element.className
                            };
                        }
                    }
                }
                return null;
            }, searchText);
            
            if (elementInfo) {
                this.log(`✅ Элемент найден: "${elementInfo.text}"`);
                return {
                    element: null, // Не можем вернуть handle из evaluate
                    text: elementInfo.text,
                    x: elementInfo.x,
                    y: elementInfo.y,
                    confidence: 0.95,
                    tagName: elementInfo.tagName,
                    className: elementInfo.className
                };
            }
            
            // Альтернативный поиск через CSS селекторы
            const elements = await this.page.$$('button, a, span, div, p, h1, h2, h3, h4, h5, h6');
            
            for (const element of elements) {
                try {
                    const text = await element.evaluate(el => el.textContent?.trim());
                    if (text && text.includes(searchText)) {
                        const isVisible = await element.isVisible();
                        if (isVisible) {
                            const box = await element.boundingBox();
                            this.log(`✅ Элемент найден через CSS: "${text}"`);
                            return {
                                element: element,
                                text: text,
                                x: box.x + box.width / 2,
                                y: box.y + box.height / 2,
                                confidence: 0.9
                            };
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            this.log(`❌ Элемент не найден: "${searchText}"`, 'warning');
            return null;
            
        } catch (error) {
            this.log(`❌ Ошибка при поиске элемента: ${error.message}`, 'error');
            this.addError(`Ошибка при поиске элемента "${searchText}"`, error);
            return null;
        }
    }

    async findElementByTestId(testId, timeout = 10000) {
        try {
            this.log(`🔍 Поиск элемента по testId: "${testId}"`);
            
            const element = await this.page.$(`[data-testid="${testId}"]`);
            if (element) {
                const isVisible = await element.isVisible();
                if (isVisible) {
                    const box = await element.boundingBox();
                    this.log(`✅ Элемент найден: "${testId}"`);
                    return {
                        element: element,
                        testId: testId,
                        x: box.x + box.width / 2,
                        y: box.y + box.height / 2,
                        confidence: 0.9
                    };
                }
            }
            
            this.log(`❌ Элемент не найден: "${testId}"`, 'warning');
            return null;
            
        } catch (error) {
            this.log(`❌ Ошибка при поиске элемента: ${error.message}`, 'error');
            return null;
        }
    }

    async clickElement(element, description = '') {
        try {
            this.log(`🖱️ Клик по элементу: ${description}`);
            
            if (element.element) {
                // Если у нас есть handle элемента
                await element.element.click();
            } else if (element.x && element.y) {
                // Если у нас есть только координаты
                await this.page.mouse.click(element.x, element.y);
            } else {
                throw new Error('Нет элемента или координат для клика');
            }
            
            await this.pause(2000);
            this.log(`✅ Клик выполнен: ${description}`);
            return true;
        } catch (error) {
            this.log(`❌ Ошибка при клике: ${error.message}`, 'error');
            return false;
        }
    }

    async typeText(text, description = '') {
        try {
            this.log(`⌨️ Ввод текста: "${text}" - ${description}`);
            await this.page.keyboard.type(text);
            await this.pause(1000);
            this.log(`✅ Текст введен: "${text}"`);
            return true;
        } catch (error) {
            this.log(`❌ Ошибка при вводе текста: ${error.message}`, 'error');
            return false;
        }
    }

    async executeAction(action, state) {
        try {
            this.log(`🎯 Выполнение действия: ${action}`);
            
            switch (action) {
                case 'create_post':
                    return await this.createPost();
                    
                case 'like_post':
                    return await this.likePost();
                    
                case 'send_message':
                    return await this.sendMessage();
                    
                case 'open_menu':
                    return await this.openMenu();
                    
                case 'write_post':
                    return await this.writePost();
                    
                case 'publish_post':
                    return await this.publishPost();
                    
                default:
                    this.log(`❌ Неизвестное действие: ${action}`, 'error');
                    return false;
            }
            
        } catch (error) {
            this.log(`❌ Ошибка при выполнении действия: ${error.message}`, 'error');
            return false;
        }
    }

    async createPost() {
        try {
            this.log('✏️ Создание поста...');
            
            // Ищем поле создания поста
            const postField = await this.findElementByText('Что у вас нового?');
            if (!postField) {
                this.log('❌ Поле создания поста не найдено', 'error');
                return false;
            }
            
            // Кликаем на поле
            await this.clickElement(postField, 'поле создания поста');
            
            // Вводим текст
            const postText = `Тестовый пост от OCR бота - ${new Date().toLocaleTimeString()}`;
            await this.typeText(postText, 'текст поста');
            
            // Ищем кнопку отправки
            const sendButton = await this.findElementByText('ОТПРАВИТЬ');
            if (!sendButton) {
                this.log('❌ Кнопка отправки не найдена', 'error');
                return false;
            }
            
            // Отправляем пост
            await this.clickElement(sendButton, 'кнопка отправки');
            
            this.log('✅ Пост создан успешно');
            return true;
            
        } catch (error) {
            this.log(`❌ Ошибка при создании поста: ${error.message}`, 'error');
            return false;
        }
    }

    async likePost() {
        try {
            this.log('👍 Лайк поста...');
            
            // Ищем кнопку "Нравится" на первом посте
            const likeButton = await this.findElementByText('Нравится');
            if (!likeButton) {
                this.log('❌ Кнопка "Нравится" не найдена', 'error');
                return false;
            }
            
            // Кликаем на лайк
            await this.clickElement(likeButton, 'кнопка "Нравится"');
            
            this.log('✅ Лайк поставлен');
            return true;
            
        } catch (error) {
            this.log(`❌ Ошибка при лайке поста: ${error.message}`, 'error');
            return false;
        }
    }

    async sendMessage() {
        try {
            this.log('💬 Отправка сообщения...');
            
            // Ищем кнопку чата
            const chatButton = await this.findElementByTestId('SmartToyIcon');
            if (!chatButton) {
                this.log('❌ Кнопка чата не найдена', 'error');
                return false;
            }
            
            // Открываем чат
            await this.clickElement(chatButton, 'кнопка чата');
            
            // Ждем открытия чата
            await this.pause(2000);
            
            // Проверяем состояние
            const state = await this.analyzeCurrentState();
            if (state.name === 'Чат') {
                this.log('✅ Чат открыт успешно');
                return true;
            } else {
                this.log('❌ Чат не открылся', 'error');
                return false;
            }
            
        } catch (error) {
            this.log(`❌ Ошибка при отправке сообщения: ${error.message}`, 'error');
            return false;
        }
    }

    async openMenu() {
        try {
            this.log('📋 Открытие меню...');
            
            // Расширенный список селекторов для кнопки меню
            const menuSelectors = [
                'MenuIcon',
                'ListAltIcon',
                'SettingsIcon',
                'MoreVertIcon',
                'AppsIcon',
                'DashboardIcon'
            ];
            
            for (const selector of menuSelectors) {
                const menuButton = await this.findElementByTestId(selector);
                if (menuButton) {
                    await this.clickElement(menuButton, `кнопка меню (${selector})`);
                    
                    // Проверяем, открылось ли меню
                    await this.pause(1000);
                    
                    // Проверяем наличие элементов меню
                    const hasMenuItems = await this.page.evaluate(() => {
                        const menuTexts = ['Обзор', 'Топ посты', 'Достижения', 'Найти', 'Фильтры'];
                        return menuTexts.some(text => document.body.innerText.includes(text));
                    });
                    
                    if (hasMenuItems) {
                        this.log('✅ Меню открыто успешно');
                        return true;
                    }
                }
            }
            
            // Альтернативный поиск по тексту
            const menuButton = await this.findElementByText('Меню');
            if (menuButton) {
                await this.clickElement(menuButton, 'кнопка меню (по тексту)');
                await this.pause(1000);
                return true;
            }
            
            this.log('❌ Кнопка меню не найдена', 'error');
            return false;
            
        } catch (error) {
            this.log(`❌ Ошибка при открытии меню: ${error.message}`, 'error');
            return false;
        }
    }

    async writePost() {
        try {
            this.log('⌨️ Написание поста...');
            
            const postText = `Пост от OCR бота - ${new Date().toLocaleTimeString()}`;
            await this.typeText(postText, 'текст поста');
            
            this.log('✅ Текст поста написан');
            return true;
            
        } catch (error) {
            this.log(`❌ Ошибка при написании поста: ${error.message}`, 'error');
            return false;
        }
    }

    async publishPost() {
        try {
            this.log('📤 Публикация поста...');
            
            const sendButton = await this.findElementByText('ОТПРАВИТЬ');
            if (!sendButton) {
                this.log('❌ Кнопка отправки не найдена', 'error');
                return false;
            }
            
            await this.clickElement(sendButton, 'кнопка отправки');
            
            this.log('✅ Пост опубликован');
            return true;
            
        } catch (error) {
            this.log(`❌ Ошибка при публикации поста: ${error.message}`, 'error');
            return false;
        }
    }

    async runScenario(scenario) {
        try {
            this.log(`🎬 Запуск сценария: ${scenario.name}`);
            
            // Переходим на главную страницу
            await this.page.goto(this.baseUrl);
            await this.pause(3000);
            
            // Анализируем начальное состояние
            const initialState = await this.analyzeCurrentState();
            this.log(`📱 Начальное состояние: ${initialState.name}`);
            
            // Выполняем шаги сценария
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];
                this.log(`📋 Шаг ${i + 1}: ${step.description}`);
                
                // Анализируем состояние перед действием
                const state = await this.analyzeCurrentState();
                
                // Выполняем действие
                const success = await this.executeAction(step.action, state);
                
                if (!success) {
                    this.log(`❌ Ошибка на шаге ${i + 1}`, 'error');
                    await this.takeScreenshot(`error_step_${i + 1}.png`, `Ошибка на шаге ${i + 1}`);
                    return false;
                }
                
                // Ждем после действия
                await this.pause(step.delay || 2000);
            }
            
            this.log('✅ Сценарий выполнен успешно');
            await this.takeScreenshot('success_scenario.png', 'Успешное выполнение сценария');
            return true;
            
        } catch (error) {
            this.log(`❌ Ошибка при выполнении сценария: ${error.message}`, 'error');
            await this.takeScreenshot('error_scenario.png', 'Ошибка сценария');
            return false;
        }
    }

    async runMultiuserTest() {
        try {
            this.log('👥 Запуск многопользовательского теста...');
            
            // Создаем второй браузер для симуляции второго пользователя
            const browser2 = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1920, height: 1080 }
            });
            const page2 = await browser2.newPage();
            
            try {
                // Первый пользователь создает пост
                this.log('👤 Пользователь 1: Создание поста');
                await this.createPost();
                await this.takeScreenshot('user1_post_created.png', 'Пользователь 1 создал пост');
                
                // Второй пользователь заходит
                this.log('👤 Пользователь 2: Вход в систему');
                await page2.goto(this.baseUrl);
                await this.pause(3000);
                
                await page2.screenshot({ 
                    path: `${this.screenshotsDir}/user2_initial.png`,
                    fullPage: true 
                });
                this.log('📸 Пользователь 2: Начальное состояние');
                
                // Второй пользователь ставит лайк
                this.log('👤 Пользователь 2: Лайк поста');
                const likeButton = await page2.evaluateHandle(() => {
                    const elements = document.querySelectorAll('button');
                    for (const element of elements) {
                        if (element.textContent && element.textContent.includes('Нравится')) {
                            return element;
                        }
                    }
                    return null;
                });
                
                if (likeButton) {
                    await likeButton.click();
                    await this.pause(1000);
                    this.log('✅ Пользователь 2 поставил лайк');
                }
                
                await page2.screenshot({ 
                    path: `${this.screenshotsDir}/user2_liked.png`,
                    fullPage: true 
                });
                this.log('📸 Пользователь 2: После лайка');
                
                this.log('✅ Многопользовательский тест завершен');
                return true;
                
            } finally {
                await browser2.close();
            }
            
        } catch (error) {
            this.log(`❌ Ошибка в многопользовательском тесте: ${error.message}`, 'error');
            return false;
        }
    }

    async generateReport() {
        try {
            this.log('📄 Генерация отчета...');
            
            const report = {
                timestamp: new Date().toISOString(),
                logs: this.logs,
                summary: {
                    totalActions: this.logs.filter(log => log.type === 'info').length,
                    errors: this.logs.filter(log => log.type === 'error').length,
                    warnings: this.logs.filter(log => log.type === 'warning').length,
                    success: this.logs.filter(log => log.message.includes('✅')).length
                }
            };
            
            const reportPath = `${this.screenshotsDir}/test_report.json`;
            require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
            
            this.log(`✅ Отчет сохранен: ${reportPath}`);
            return report;
            
        } catch (error) {
            this.log(`❌ Ошибка при генерации отчета: ${error.message}`, 'error');
            return null;
        }
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
            this.log('🧹 Очистка завершена');
        } catch (error) {
            this.log(`❌ Ошибка при очистке: ${error.message}`, 'error');
        }
    }

    // Функция для обработки всех ошибок в конце выполнения
    handleFinalErrors() {
        if (this.errors.length > 0) {
            console.log('\n=== ОШИБКИ ВЫПОЛНЕНИЯ ===');
            console.log(`Найдено ошибок: ${this.errors.length}`);
            
            this.errors.forEach((error, index) => {
                console.log(`\nОшибка ${index + 1}:`);
                console.log(`Описание: ${error.description}`);
                console.log(`Скриншот: ${error.screenshotPath}`);
                console.log(`Время: ${error.timestamp}`);
                if (error.stack) {
                    console.log(`Стек вызовов: ${error.stack}`);
                }
                console.log('---');
            });
            
            console.log('\n=== КОНЕЦ ОТЧЕТА ОБ ОШИБКАХ ===');
            
            // Показываем итоговое уведомление
            const finalTitle = `Завершение автоматизации - ${this.errors.length} ошибок`;
            const finalMessage = `Найдено ${this.errors.length} ошибок.\n\nПроверьте консоль для детальной информации.\n\nСкриншоты ошибок сохранены в: ${this.screenshotsDir}`;
            this.showWindowsNotification(finalTitle, finalMessage);
            
            return false;
        }
        
        return true;
    }
}

module.exports = FinalOCRBot; 