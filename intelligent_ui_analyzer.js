const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');

class IntelligentUIAnalyzer {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.userProfiles = [];
        this.stepCounter = 0;
    }

    async init(browserCount = 2) {
        console.log(`🧠 Инициализация интеллектуального UI анализатора (${browserCount} браузеров)...`);
        
        // Создаем уникальные профили для каждого браузера
        for (let i = 0; i < browserCount; i++) {
            const profileDir = `./intelligent-user-data-${i}`;
            
            if (fs.existsSync(profileDir)) {
                fs.rmSync(profileDir, { recursive: true, force: true });
            }
            
            this.userProfiles.push(profileDir);
        }
        
        // Запускаем браузеры с изолированными профилями
        for (let i = 0; i < browserCount; i++) {
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: [
                    '--start-maximized', 
                    '--no-sandbox',
                    `--user-data-dir=${this.userProfiles[i]}`,
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            
            const page = await browser.newPage();
            
            await page.setExtraHTTPHeaders({
                'X-User-Agent': `IntelligentAnalyzer-${i + 1}`,
                'X-User-ID': `user-${i + 1}`
            });
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен с изолированным профилем: ${this.userProfiles[i]}`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/intelligent_step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
        await this.pages[pageIndex].screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот браузера ${pageIndex + 1} сохранен: ${filename}`);
        return filename;
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

    async analyzeIntelligentDOM(pageIndex) {
        console.log(`🧠 Браузер ${pageIndex + 1}: Интеллектуальный анализ DOM структуры`);
        
        try {
            const intelligentInfo = await this.pages[pageIndex].evaluate(() => {
                const info = {
                    // Общая структура страницы
                    pageStructure: {
                        title: document.title,
                        url: window.location.href,
                        viewport: {
                            width: window.innerWidth,
                            height: window.innerHeight
                        }
                    },
                    
                    // Анализ модальных окон и их контекста
                    modals: [],
                    
                    // Анализ кнопок с контекстом
                    buttons: {
                        all: [],
                        loginButtons: [],
                        guestButtons: [],
                        profileButtons: [],
                        navigationButtons: [],
                        actionButtons: []
                    },
                    
                    // Анализ форм и их назначения
                    forms: [],
                    
                    // Анализ пользовательского интерфейса
                    userInterface: {
                        header: null,
                        sidebar: {
                            left: null,
                            right: null
                        },
                        mainContent: null,
                        footer: null
                    },
                    
                    // Анализ пользователей
                    users: {
                        currentUser: null,
                        otherUsers: [],
                        userElements: []
                    },
                    
                    // Анализ контента
                    content: {
                        posts: [],
                        chats: [],
                        messages: [],
                        notifications: []
                    }
                };

                // ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ МОДАЛЬНЫХ ОКНОВ
                const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"], [class*="popup"], [class*="overlay"]');
                modals.forEach(modal => {
                    const rect = modal.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const modalText = modal.textContent?.toLowerCase() || '';
                        
                        // Определяем тип модального окна по контексту
                        let modalType = 'unknown';
                        if (modalText.includes('войти') || modalText.includes('login') || modalText.includes('вход')) {
                            modalType = 'login';
                        } else if (modalText.includes('профиль') || modalText.includes('profile') || modalText.includes('настройки')) {
                            modalType = 'profile';
                        } else if (modalText.includes('выберите') || modalText.includes('выбор') || modalText.includes('choose')) {
                            modalType = 'selection';
                        }
                        
                        info.modals.push({
                            type: modalType,
                            tagName: modal.tagName,
                            className: modal.className,
                            id: modal.id,
                            text: modal.textContent?.substring(0, 300),
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            context: modalText
                        });
                    }
                });

                // ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ КНОПОК
                const buttons = document.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
                buttons.forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const buttonText = btn.textContent?.trim() || '';
                        const ariaLabel = btn.getAttribute('aria-label') || '';
                        const className = btn.className || '';
                        const fullText = (buttonText + ' ' + ariaLabel).toLowerCase();
                        
                        const buttonInfo = {
                            text: buttonText,
                            ariaLabel: ariaLabel,
                            className: className,
                            id: btn.id,
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            context: fullText
                        };
                        
                        info.buttons.all.push(buttonInfo);
                        
                        // КЛАССИФИКАЦИЯ КНОПОК ПО КОНТЕКСТУ
                        
                        // Кнопки входа
                        if (fullText.includes('войти') || fullText.includes('login') || fullText.includes('sign in')) {
                            info.buttons.loginButtons.push(buttonInfo);
                        }
                        
                        // Кнопки гостевого входа (точное совпадение)
                        if (fullText.includes('продолжить как гость') || 
                            fullText.includes('continue as guest') ||
                            (fullText.includes('гость') && fullText.includes('продолжить')) ||
                            (fullText.includes('guest') && fullText.includes('continue'))) {
                            info.buttons.guestButtons.push(buttonInfo);
                        }
                        
                        // Кнопки профиля (иконки, настройки)
                        if (fullText.includes('профиль') || fullText.includes('profile') || 
                            fullText.includes('настройки') || fullText.includes('settings') ||
                            className.includes('avatar') || className.includes('profile') ||
                            buttonText.length === 1 || buttonText.length === 0) {
                            info.buttons.profileButtons.push(buttonInfo);
                        }
                        
                        // Навигационные кнопки
                        if (fullText.includes('домой') || fullText.includes('home') ||
                            fullText.includes('чат') || fullText.includes('chat') ||
                            fullText.includes('посты') || fullText.includes('posts')) {
                            info.buttons.navigationButtons.push(buttonInfo);
                        }
                        
                        // Кнопки действий
                        if (fullText.includes('создать') || fullText.includes('create') ||
                            fullText.includes('отправить') || fullText.includes('send') ||
                            fullText.includes('сохранить') || fullText.includes('save')) {
                            info.buttons.actionButtons.push(buttonInfo);
                        }
                    }
                });

                // ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ СТРУКТУРЫ СТРАНИЦЫ
                
                // Анализ заголовка
                const header = document.querySelector('header, [class*="header"], [class*="app-bar"]');
                if (header) {
                    const rect = header.getBoundingClientRect();
                    info.userInterface.header = {
                        element: header.tagName,
                        className: header.className,
                        text: header.textContent?.substring(0, 200),
                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    };
                }
                
                // Анализ левой панели
                const leftSidebar = document.querySelector('[class*="sidebar"], [class*="nav"], [class*="menu"]');
                if (leftSidebar) {
                    const rect = leftSidebar.getBoundingClientRect();
                    if (rect.x < window.innerWidth * 0.3) {
                        info.userInterface.sidebar.left = {
                            element: leftSidebar.tagName,
                            className: leftSidebar.className,
                            text: leftSidebar.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                    }
                }
                
                // Анализ правой панели (пользователи)
                const rightSidebar = document.querySelector('[class*="sidebar"], [class*="panel"], [class*="users"]');
                if (rightSidebar) {
                    const rect = rightSidebar.getBoundingClientRect();
                    if (rect.x > window.innerWidth * 0.6) {
                        info.userInterface.sidebar.right = {
                            element: rightSidebar.tagName,
                            className: rightSidebar.className,
                            text: rightSidebar.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                    }
                }
                
                // Анализ основного контента
                const mainContent = document.querySelector('main, [class*="main"], [class*="content"], [class*="feed"]');
                if (mainContent) {
                    const rect = mainContent.getBoundingClientRect();
                    info.userInterface.mainContent = {
                        element: mainContent.tagName,
                        className: mainContent.className,
                        text: mainContent.textContent?.substring(0, 200),
                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    };
                }

                // ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ ПОЛЬЗОВАТЕЛЕЙ
                const userElements = document.querySelectorAll('[class*="user"], [class*="profile"], [data-testid*="user"], [class*="avatar"]');
                userElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const elementInfo = {
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id,
                            text: el.textContent?.trim() || '',
                            dataTestId: el.getAttribute('data-testid') || '',
                            ariaLabel: el.getAttribute('aria-label') || '',
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                        
                        info.users.userElements.push(elementInfo);
                        
                        // Определяем текущего пользователя (обычно в верхней части)
                        if (rect.y < 100 && elementInfo.text) {
                            info.users.currentUser = elementInfo;
                        }
                        
                        // Определяем других пользователей (в правой панели)
                        if (rect.x > window.innerWidth * 0.6 && elementInfo.text) {
                            info.users.otherUsers.push(elementInfo);
                        }
                    }
                });

                // ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ ФОРМ
                const forms = document.querySelectorAll('form, [class*="form"]');
                forms.forEach(form => {
                    const rect = form.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const formText = form.textContent?.toLowerCase() || '';
                        
                        let formType = 'unknown';
                        if (formText.includes('войти') || formText.includes('login')) {
                            formType = 'login';
                        } else if (formText.includes('регистрация') || formText.includes('register')) {
                            formType = 'register';
                        } else if (formText.includes('пост') || formText.includes('post')) {
                            formType = 'post';
                        } else if (formText.includes('сообщение') || formText.includes('message')) {
                            formType = 'message';
                        }
                        
                        info.forms.push({
                            type: formType,
                            className: form.className,
                            id: form.id,
                            action: form.action,
                            visible: rect.width > 0 && rect.height > 0,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            context: formText
                        });
                    }
                });

                // ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ КОНТЕНТА
                
                // Посты
                const posts = document.querySelectorAll('[class*="post"], [class*="feed"], [class*="card"]');
                posts.forEach(post => {
                    const rect = post.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.content.posts.push({
                            tagName: post.tagName,
                            className: post.className,
                            text: post.textContent?.substring(0, 100),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });
                
                // Чаты
                const chats = document.querySelectorAll('[class*="chat"], [class*="conversation"]');
                chats.forEach(chat => {
                    const rect = chat.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.content.chats.push({
                            tagName: chat.tagName,
                            className: chat.className,
                            text: chat.textContent?.substring(0, 100),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });
                
                // Сообщения
                const messages = document.querySelectorAll('[class*="message"], [class*="msg"]');
                messages.forEach(msg => {
                    const rect = msg.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.content.messages.push({
                            tagName: msg.tagName,
                            className: msg.className,
                            text: msg.textContent?.substring(0, 100),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });

                return info;
            });

            console.log(`🧠 Браузер ${pageIndex + 1}: Интеллектуальный анализ завершен`);
            console.log(`   - Модальных окон: ${intelligentInfo.modals.length}`);
            console.log(`   - Всего кнопок: ${intelligentInfo.buttons.all.length}`);
            console.log(`   - Кнопок входа: ${intelligentInfo.buttons.loginButtons.length}`);
            console.log(`   - Кнопок гостевого входа: ${intelligentInfo.buttons.guestButtons.length}`);
            console.log(`   - Кнопок профиля: ${intelligentInfo.buttons.profileButtons.length}`);
            console.log(`   - Элементов пользователей: ${intelligentInfo.users.userElements.length}`);
            console.log(`   - Других пользователей: ${intelligentInfo.users.otherUsers.length}`);
            console.log(`   - Форм: ${intelligentInfo.forms.length}`);
            console.log(`   - Постов: ${intelligentInfo.content.posts.length}`);
            console.log(`   - Чатов: ${intelligentInfo.content.chats.length}`);

            return intelligentInfo;

        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка интеллектуального анализа:`, error.message);
            return null;
        }
    }

    determineIntelligentState(intelligentInfo, allText) {
        console.log(`🧠 Определение интеллектуального состояния интерфейса`);
        
        const textStrings = allText.map(item => item.text);
        const fullText = textStrings.join(' ');
        
        // АНАЛИЗ ОБЩЕЙ КАРТИНЫ
        const analysis = {
            hasModals: intelligentInfo.modals.length > 0,
            hasLoginModal: intelligentInfo.modals.some(m => m.type === 'login'),
            hasProfileModal: intelligentInfo.modals.some(m => m.type === 'profile'),
            hasSelectionModal: intelligentInfo.modals.some(m => m.type === 'selection'),
            
            hasLoginButtons: intelligentInfo.buttons.loginButtons.length > 0,
            hasGuestButtons: intelligentInfo.buttons.guestButtons.length > 0,
            hasProfileButtons: intelligentInfo.buttons.profileButtons.length > 0,
            
            hasCurrentUser: intelligentInfo.users.currentUser !== null,
            hasOtherUsers: intelligentInfo.users.otherUsers.length > 0,
            hasManyUsers: intelligentInfo.users.userElements.length > 10, // Много пользователей
            
            hasMainContent: intelligentInfo.userInterface.mainContent !== null,
            hasRightSidebar: intelligentInfo.userInterface.sidebar.right !== null,
            hasLeftSidebar: intelligentInfo.userInterface.sidebar.left !== null,
            
            hasPosts: intelligentInfo.content.posts.length > 0,
            hasChats: intelligentInfo.content.chats.length > 0,
            hasMessages: intelligentInfo.content.messages.length > 0,
            
            hasLoginForms: intelligentInfo.forms.some(f => f.type === 'login'),
            hasPostForms: intelligentInfo.forms.some(f => f.type === 'post'),
            hasMessageForms: intelligentInfo.forms.some(f => f.type === 'message')
        };
        
        // ИНТЕЛЛЕКТУАЛЬНОЕ ОПРЕДЕЛЕНИЕ СОСТОЯНИЯ
        let stateName = 'unknown';
        let description = 'Неизвестное состояние';
        let confidence = 0;
        const indicators = [];
        
        // ЛОГИКА ОПРЕДЕЛЕНИЯ СОСТОЯНИЯ (как человек)
        
        // 1. Если есть модальное окно входа с кнопкой гостевого входа
        if (analysis.hasLoginModal && analysis.hasGuestButtons) {
            stateName = 'guest_login_modal';
            description = 'Модальное окно гостевого входа';
            confidence = 95;
            indicators.push('модальное окно входа', 'кнопка гостевого входа');
        }
        
        // 2. Если есть модальное окно выбора способа входа
        else if (analysis.hasSelectionModal && (fullText.includes('выберите') || fullText.includes('choose'))) {
            stateName = 'login_methods';
            description = 'Модальное окно выбора способа входа';
            confidence = 90;
            indicators.push('модальное окно выбора', 'способы входа');
        }
        
        // 3. Если есть модальное окно профиля
        else if (analysis.hasProfileModal) {
            stateName = 'profile_modal';
            description = 'Модальное окно профиля пользователя';
            confidence = 85;
            indicators.push('модальное окно профиля', 'настройки пользователя');
        }
        
        // 4. УЛУЧШЕННОЕ ОПРЕДЕЛЕНИЕ ОСНОВНОГО ПРИЛОЖЕНИЯ
        else if (!analysis.hasModals && (analysis.hasManyUsers || analysis.hasOtherUsers || analysis.hasMainContent)) {
            stateName = 'main_app';
            description = 'Основное приложение (пользователь вошел)';
            confidence = 95;
            indicators.push('нет модальных окон', 'много пользователей', 'пользователь вошел');
        }
        
        // 5. Если есть основной контент, посты, чаты - пользователь вошел
        else if (analysis.hasMainContent && (analysis.hasPosts || analysis.hasChats || analysis.hasMessages)) {
            stateName = 'main_app';
            description = 'Основное приложение (пользователь вошел)';
            confidence = 95;
            indicators.push('основной контент', 'посты/чаты', 'пользователь вошел');
        }
        
        // 6. Если есть текущий пользователь, но нет основного контента
        else if (analysis.hasCurrentUser && !analysis.hasMainContent) {
            stateName = 'user_profile';
            description = 'Профиль пользователя';
            confidence = 80;
            indicators.push('текущий пользователь', 'профиль');
        }
        
        // 7. Если есть кнопки входа, но нет модальных окон
        else if (analysis.hasLoginButtons && !analysis.hasModals) {
            stateName = 'login_selection';
            description = 'Экран выбора способа входа';
            confidence = 75;
            indicators.push('кнопки входа', 'выбор способа');
        }
        
        // 8. Если есть формы входа
        else if (analysis.hasLoginForms) {
            stateName = 'login_form';
            description = 'Форма входа';
            confidence = 85;
            indicators.push('форма входа');
        }
        
        // 9. Если есть ошибки
        else if (fullText.includes('ошибка') || fullText.includes('error') || fullText.includes('неверно')) {
            stateName = 'error_state';
            description = 'Состояние ошибки';
            confidence = 90;
            indicators.push('ошибка');
        }
        
        return {
            name: stateName,
            description: description,
            confidence: confidence,
            indicators: indicators,
            analysis: analysis,
            intelligentInfo: intelligentInfo
        };
    }

    async analyzeIntelligentState(pageIndex, description = '') {
        console.log(`🧠 Браузер ${pageIndex + 1}: Интеллектуальный анализ состояния ${description}`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, `intelligent_${description.replace(/\s+/g, '_')}`);
        const intelligentInfo = await this.analyzeIntelligentDOM(pageIndex);
        const allText = await this.extractAllText(screenshotPath);
        
        // Интеллектуальный анализ состояния
        const state = this.determineIntelligentState(intelligentInfo, allText);
        
        console.log(`🧠 Браузер ${pageIndex + 1}: Интеллектуальное состояние:`);
        console.log(`   📊 Состояние: ${state.name} (уверенность: ${state.confidence}%)`);
        console.log(`   📝 Описание: ${state.description}`);
        console.log(`   🔍 Признаки: ${state.indicators.join(', ')}`);
        
        // Детальная информация
        if (intelligentInfo.users.currentUser) {
            console.log(`   👤 Текущий пользователь: "${intelligentInfo.users.currentUser.text}"`);
        }
        
        if (intelligentInfo.users.otherUsers.length > 0) {
            console.log(`   👥 Другие пользователи: ${intelligentInfo.users.otherUsers.length}`);
            intelligentInfo.users.otherUsers.forEach((user, index) => {
                console.log(`      ${index + 1}. "${user.text}"`);
            });
        }
        
        if (intelligentInfo.buttons.guestButtons.length > 0) {
            console.log(`   🎯 Найдены кнопки гостевого входа: ${intelligentInfo.buttons.guestButtons.length}`);
            intelligentInfo.buttons.guestButtons.forEach((btn, index) => {
                console.log(`      ${index + 1}. "${btn.text}" (${btn.ariaLabel})`);
            });
        }
        
        return {
            state: state,
            intelligentInfo: intelligentInfo,
            allText: allText,
            screenshotPath: screenshotPath
        };
    }

    async intelligentGuestLogin(pageIndex) {
        console.log(`\n🧠 Браузер ${pageIndex + 1}: Интеллектуальный гостевой вход`);
        // Анализируем начальное состояние
        const initialState = await this.analyzeIntelligentState(pageIndex, 'initial');
        if (initialState.state.name === 'main_app') {
            console.log(`✅ Браузер ${pageIndex + 1}: Пользователь уже вошел в систему`);
            return { success: true, alreadyLoggedIn: true, currentUser: initialState.intelligentInfo.users.currentUser };
        }
        // 1. Поиск кнопки гостевого входа по всем возможным признакам
        const guestButtons = await this.pages[pageIndex].evaluate(() => {
            const candidates = [];
            const elements = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"], [data-testid], [aria-label]'));
            for (const el of elements) {
                const text = el.textContent?.toLowerCase() || '';
                const aria = el.getAttribute('aria-label')?.toLowerCase() || '';
                const testid = el.getAttribute('data-testid')?.toLowerCase() || '';
                const role = el.getAttribute('role')?.toLowerCase() || '';
                let cls = '';
                if (typeof el.className === 'string') {
                    cls = el.className.toLowerCase();
                } else if (el.className && typeof el.className.baseVal === 'string') {
                    cls = el.className.baseVal.toLowerCase();
                }
                if (
                    (text.includes('гость') && text.includes('продолжить')) ||
                    (aria.includes('гость') && aria.includes('продолжить')) ||
                    (text.includes('guest') && text.includes('continue')) ||
                    (aria.includes('guest') && aria.includes('continue')) ||
                    (testid.includes('guest')) ||
                    (role === 'button' && (text.includes('гость') || aria.includes('гость')))
                ) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        candidates.push({
                            text,
                            aria,
                            testid,
                            role,
                            cls,
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        });
                    }
                }
            }
            return candidates;
        });
        if (guestButtons.length === 0) {
            console.log(`❌ Браузер ${pageIndex + 1}: Кнопки гостевого входа не найдены`);
            return { success: false, reason: 'no_guest_buttons_found' };
        }
        const btn = guestButtons[0];
        // 2. Клик только по координатам (центр кнопки)
        const clickX = btn.x + btn.width / 2;
        const clickY = btn.y + btn.height / 2;
        console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${clickX}, ${clickY}) по кнопке "${btn.text}"`);
        await this.pages[pageIndex].mouse.click(clickX, clickY);
        // 3. Ждем и анализируем состояние после клика
        await new Promise(resolve => setTimeout(resolve, 3000));
        const afterState = await this.analyzeIntelligentState(pageIndex, 'after_guest_login');
        if (afterState.state.name === 'main_app') {
            console.log(`✅ Браузер ${pageIndex + 1}: Гостевой вход выполнен успешно`);
            return { success: true, loginMethod: 'guest', currentUser: afterState.intelligentInfo.users.currentUser };
        } else if (afterState.state.name === 'login_methods') {
            // Если открылось окно выбора способа входа — ищем email
            const emailBtn = afterState.intelligentInfo.buttons.all.find(b => b.text.toLowerCase().includes('email') || b.ariaLabel.toLowerCase().includes('email'));
            if (emailBtn) {
                const emailClickX = emailBtn.position.x + emailBtn.position.width / 2;
                const emailClickY = emailBtn.position.y + emailBtn.position.height / 2;
                console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${emailClickX}, ${emailClickY}) по кнопке email`);
                await this.pages[pageIndex].mouse.click(emailClickX, emailClickY);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const finalState = await this.analyzeIntelligentState(pageIndex, 'after_email_login');
                if (finalState.state.name === 'main_app') {
                    console.log(`✅ Браузер ${pageIndex + 1}: Email вход выполнен успешно`);
                    return { success: true, loginMethod: 'email', currentUser: finalState.intelligentInfo.users.currentUser };
                }
            }
        } else if (afterState.state.name === 'profile_modal') {
            console.log(`❌ Браузер ${pageIndex + 1}: Открылся профиль вместо входа — неправильная кнопка`);
            return { success: false, reason: 'wrong_button_clicked' };
        }
        return { success: false, reason: 'unexpected_state_after_click', state: afterState.state.name };
    }

    async checkRealUserInteraction(pageIndex) {
        console.log(`\n🧠 Браузер ${pageIndex + 1}: Проверка реального взаимодействия пользователей`);
        
        const state = await this.analyzeIntelligentState(pageIndex, 'user_interaction_check');
        
        const currentUser = state.intelligentInfo.users.currentUser;
        const otherUsers = state.intelligentInfo.users.otherUsers;
        
        console.log(`👤 Браузер ${pageIndex + 1}: Текущий пользователь: "${currentUser?.text || 'Не найден'}"`);
        console.log(`👥 Браузер ${pageIndex + 1}: Другие пользователи: ${otherUsers.length}`);
        
        // Извлекаем уникальные имена пользователей
        const uniqueUserNames = new Set();
        otherUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. "${user.text}" (${user.className})`);
            if (user.text) {
                // Очищаем имя от лишних символов и дублирования
                let cleanName = user.text.replace(/[ГТ]/g, '').replace(/\(Вы\)/g, '').trim();
                if (cleanName && cleanName.length > 2) {
                    uniqueUserNames.add(cleanName);
                }
            }
        });
        
        console.log(`\n📊 Браузер ${pageIndex + 1}: Уникальные имена пользователей:`);
        Array.from(uniqueUserNames).forEach((name, index) => {
            console.log(`   ${index + 1}. "${name}"`);
        });
        
        // Проверяем, есть ли реальные другие пользователи
        const hasRealOtherUsers = uniqueUserNames.size > 1; // Больше 1, так как один - это текущий пользователь
        
        if (hasRealOtherUsers) {
            console.log(`✅ Браузер ${pageIndex + 1}: Обнаружены другие пользователи в правой панели`);
            return { 
                success: true, 
                currentUser: currentUser,
                otherUsers: otherUsers,
                uniqueUserNames: Array.from(uniqueUserNames),
                userCount: uniqueUserNames.size
            };
        } else {
            console.log(`❌ Браузер ${pageIndex + 1}: Другие пользователи не обнаружены в правой панели`);
            return { 
                success: false, 
                currentUser: currentUser,
                otherUsers: [],
                uniqueUserNames: Array.from(uniqueUserNames),
                userCount: uniqueUserNames.size
            };
        }
    }

    async runIntelligentTest() {
        try {
            console.log('🧠 Запуск интеллектуального тестирования');
            
            // Шаг 1: Открываем приложение
            console.log('\n📋 Шаг 1: Открытие приложения');
            for (let i = 0; i < this.pages.length; i++) {
                await this.pages[i].goto('http://localhost:3000', { waitUntil: 'networkidle2' });
                console.log(`✅ Браузер ${i + 1}: Приложение открыто`);
            }
            
            // Ждем загрузки
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Шаг 2: Интеллектуальный гостевой вход
            console.log('\n📋 Шаг 2: Интеллектуальный гостевой вход');
            const loginResults = [];
            
            for (let i = 0; i < this.pages.length; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                const loginResult = await this.intelligentGuestLogin(i);
                loginResults.push(loginResult);
                
                if (!loginResult.success) {
                    console.log(`❌ Браузер ${i + 1}: Вход не выполнен`);
                    return false;
                }
            }
            
            // Шаг 3: Проверка реального взаимодействия
            if (this.pages.length > 1) {
                console.log('\n📋 Шаг 3: Проверка реального взаимодействия пользователей');
                
                const interactionResults = [];
                for (let i = 0; i < this.pages.length; i++) {
                    console.log(`\n--- Браузер ${i + 1} ---`);
                    const interactionResult = await this.checkRealUserInteraction(i);
                    interactionResults.push(interactionResult);
                }
                
                // Шаг 4: Сравнительный анализ
                console.log('\n📋 Шаг 4: Сравнительный анализ взаимодействия');
                
                for (let i = 0; i < interactionResults.length; i++) {
                    for (let j = i + 1; j < interactionResults.length; j++) {
                        console.log(`\n🔍 Сравнение Браузер ${i + 1} vs Браузер ${j + 1}:`);
                        
                        const user1 = loginResults[i].currentUser?.text || 'Неизвестен';
                        const user2 = loginResults[j].currentUser?.text || 'Неизвестен';
                        
                        console.log(`   Браузер ${i + 1} пользователь: "${user1}"`);
                        console.log(`   Браузер ${j + 1} пользователь: "${user2}"`);
                        
                        // Проверяем изоляцию
                        if (user1 !== user2) {
                            console.log(`   ✅ Пользователи разные - изоляция работает!`);
                        } else {
                            console.log(`   ❌ Пользователи одинаковые - изоляция не работает!`);
                        }
                        
                        // Проверяем видимость друг друга
                        const users1 = interactionResults[i].uniqueUserNames;
                        const users2 = interactionResults[j].uniqueUserNames;
                        
                        console.log(`   Браузер ${i + 1} видит других: ${users1.join(', ') || 'никого'}`);
                        console.log(`   Браузер ${j + 1} видит других: ${users2.join(', ') || 'никого'}`);
                        
                        // Ищем пересечения имен пользователей
                        const user1SeesUser2 = users1.some(name1 => 
                            users2.some(name2 => 
                                name1.toLowerCase().includes(name2.toLowerCase()) || 
                                name2.toLowerCase().includes(name1.toLowerCase()) ||
                                name1.toLowerCase() === name2.toLowerCase()
                            )
                        );
                        
                        const user2SeesUser1 = users2.some(name2 => 
                            users1.some(name1 => 
                                name2.toLowerCase().includes(name1.toLowerCase()) || 
                                name1.toLowerCase().includes(name2.toLowerCase()) ||
                                name2.toLowerCase() === name1.toLowerCase()
                            )
                        );
                        
                        if (user1SeesUser2 && user2SeesUser1) {
                            console.log(`   ✅ Пользователи видят друг друга - РЕАЛЬНОЕ ВЗАИМОДЕЙСТВИЕ!`);
                        } else if (user1SeesUser2 || user2SeesUser1) {
                            console.log(`   ⚠️ Односторонняя видимость - частичное взаимодействие`);
                        } else {
                            console.log(`   ❌ Пользователи не видят друг друга - "мертвые души" или нет взаимодействия`);
                        }
                        
                        // Детальный анализ пересечений
                        const intersections = [];
                        users1.forEach(name1 => {
                            users2.forEach(name2 => {
                                if (name1.toLowerCase().includes(name2.toLowerCase()) || 
                                    name2.toLowerCase().includes(name1.toLowerCase()) ||
                                    name1.toLowerCase() === name2.toLowerCase()) {
                                    intersections.push({ name1, name2 });
                                }
                            });
                        });
                        
                        if (intersections.length > 0) {
                            console.log(`   🔍 Найдены пересечения имен:`);
                            intersections.forEach(({ name1, name2 }) => {
                                console.log(`      "${name1}" ↔ "${name2}"`);
                            });
                        }
                    }
                }
            }
            
            console.log('\n🎉 Интеллектуальное тестирование завершено!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в интеллектуальном тестировании:', error.message);
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
        
        // Очищаем профили
        for (const profileDir of this.userProfiles) {
            if (fs.existsSync(profileDir)) {
                fs.rmSync(profileDir, { recursive: true, force: true });
                console.log(`🗑️ Профиль удален: ${profileDir}`);
            }
        }
    }
}

// Запуск интеллектуального анализатора
async function main() {
    const analyzer = new IntelligentUIAnalyzer();
    
    try {
        await analyzer.init(2); // Запускаем 2 браузера с изолированными профилями
        const success = await analyzer.runIntelligentTest();
        
        if (success) {
            console.log('\n✅ Интеллектуальное тестирование прошло успешно!');
        } else {
            console.log('\n❌ Интеллектуальное тестирование завершилось с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await analyzer.close();
    }
}

main().catch(console.error); 