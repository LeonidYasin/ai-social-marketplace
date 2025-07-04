const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');

class IntelligentUIAnalyzerFinal {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.userProfiles = [];
        this.stepCounter = 0;
        this.userNames = [];
    }

    async init(browserCount = 2) {
        console.log(`🧠 Инициализация финального интеллектуального UI анализатора (${browserCount} браузеров)...`);
        
        // Создаем уникальные профили для каждого браузера
        for (let i = 0; i < browserCount; i++) {
            const profileDir = `./intelligent-final-user-data-${i}`;
            
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
                'X-User-Agent': `IntelligentFinal-${i + 1}`,
                'X-User-ID': `user-${i + 1}`
            });
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен с изолированным профилем: ${this.userProfiles[i]}`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/intelligent_final_step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
        await this.pages[pageIndex].screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот браузера ${pageIndex + 1} сохранен: ${filename}`);
        return filename;
    }

    async analyzeFourPanelLayout(pageIndex) {
        console.log(`🧠 Браузер ${pageIndex + 1}: Анализ 4-панельной структуры интерфейса`);
        
        try {
            const layoutInfo = await this.pages[pageIndex].evaluate(() => {
                const info = {
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    panels: {
                        top: null,      // Верхняя панель (header, app bar)
                        left: null,     // Левая панель (навигация, меню)
                        right: null,    // Правая панель (пользователи, чаты)
                        center: null    // Центральная панель (основной контент)
                    },
                    profileButton: null,
                    rightPanelToggle: null
                };

                // АНАЛИЗ ВЕРХНЕЙ ПАНЕЛИ (TOP PANEL)
                const topElements = document.querySelectorAll('header, [class*="header"], [class*="app-bar"], [class*="top"], [class*="navbar"]');
                for (const el of topElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && rect.y < window.innerHeight * 0.2) {
                        info.panels.top = {
                            element: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            elements: []
                        };
                        
                        // Анализируем элементы верхней панели
                        const topChildren = el.querySelectorAll('button, [role="button"], .btn, [class*="button"], [class*="avatar"], [class*="profile"]');
                        topChildren.forEach(child => {
                            const childRect = child.getBoundingClientRect();
                            if (childRect.width > 0 && childRect.height > 0) {
                                const elementInfo = {
                                    tagName: child.tagName,
                                    className: typeof child.className === 'string' ? child.className : '',
                                    text: child.textContent?.trim() || '',
                                    ariaLabel: child.getAttribute('aria-label') || '',
                                    position: { x: childRect.x, y: childRect.y, width: childRect.width, height: childRect.height }
                                };
                                
                                info.panels.top.elements.push(elementInfo);
                                
                                // Ищем кнопку профиля
                                if (child.className?.includes('avatar') || 
                                    child.className?.includes('profile') || 
                                    child.getAttribute('aria-label')?.includes('профиль') ||
                                    child.getAttribute('aria-label')?.includes('profile') ||
                                    child.textContent?.includes('(Вы)') ||
                                    child.textContent?.includes('(You)')) {
                                    info.profileButton = elementInfo;
                                }
                            }
                        });
                        break;
                    }
                }

                // АНАЛИЗ ЛЕВОЙ ПАНЕЛИ (LEFT PANEL)
                const leftElements = document.querySelectorAll('[class*="sidebar"], [class*="nav"], [class*="menu"], [class*="left"]');
                for (const el of leftElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && rect.x < window.innerWidth * 0.3) {
                        info.panels.left = {
                            element: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            elements: []
                        };
                        
                        // Анализируем элементы левой панели
                        const leftChildren = el.querySelectorAll('button, [role="button"], .btn, [class*="button"], [class*="nav-item"]');
                        leftChildren.forEach(child => {
                            const childRect = child.getBoundingClientRect();
                            if (childRect.width > 0 && childRect.height > 0) {
                                info.panels.left.elements.push({
                                    tagName: child.tagName,
                                    className: typeof child.className === 'string' ? child.className : '',
                                    text: child.textContent?.trim() || '',
                                    ariaLabel: child.getAttribute('aria-label') || '',
                                    position: { x: childRect.x, y: childRect.y, width: childRect.width, height: childRect.height }
                                });
                            }
                        });
                        break;
                    }
                }

                // АНАЛИЗ ПРАВОЙ ПАНЕЛИ (RIGHT PANEL) - ПОЛЬЗОВАТЕЛИ
                const rightElements = document.querySelectorAll('[class*="sidebar"], [class*="panel"], [class*="users"], [class*="right"], [class*="chat"]');
                for (const el of rightElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && rect.x > window.innerWidth * 0.6) {
                        info.panels.right = {
                            element: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            users: []
                        };
                        
                        // Анализируем пользователей в правой панели
                        const userElements = el.querySelectorAll('[class*="user"], [class*="profile"], [data-testid*="user"], [class*="avatar"], [class*="list-item"], [class*="chat-item"]');
                        userElements.forEach(user => {
                            const userRect = user.getBoundingClientRect();
                            if (userRect.width > 0 && userRect.height > 0) {
                                info.panels.right.users.push({
                                    tagName: user.tagName,
                                    className: typeof user.className === 'string' ? user.className : '',
                                    text: user.textContent?.trim() || '',
                                    ariaLabel: user.getAttribute('aria-label') || '',
                                    dataTestId: user.getAttribute('data-testid') || '',
                                    position: { x: userRect.x, y: userRect.y, width: userRect.width, height: userRect.height },
                                    isCurrentUser: user.textContent?.includes('(Вы)') || user.textContent?.includes('(You)') || false
                                });
                            }
                        });
                        break;
                    }
                }

                // АНАЛИЗ ЦЕНТРАЛЬНОЙ ПАНЕЛИ (CENTER PANEL) - ОСНОВНОЙ КОНТЕНТ
                const centerElements = document.querySelectorAll('main, [class*="main"], [class*="content"], [class*="feed"], [class*="center"]');
                for (const el of centerElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && 
                        rect.x > window.innerWidth * 0.2 && rect.x < window.innerWidth * 0.6) {
                        info.panels.center = {
                            element: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            elements: []
                        };
                        
                        // Анализируем элементы центральной панели
                        const centerChildren = el.querySelectorAll('[class*="post"], [class*="card"], [class*="feed"], [class*="content"]');
                        centerChildren.forEach(child => {
                            const childRect = child.getBoundingClientRect();
                            if (childRect.width > 0 && childRect.height > 0) {
                                info.panels.center.elements.push({
                                    tagName: child.tagName,
                                    className: typeof child.className === 'string' ? child.className : '',
                                    text: child.textContent?.substring(0, 100),
                                    position: { x: childRect.x, y: childRect.y, width: childRect.width, height: childRect.height }
                                });
                            }
                        });
                        break;
                    }
                }

                // Ищем кнопку переключения правой панели (для мобильной версии)
                const toggleButtons = document.querySelectorAll('button, [role="button"], .btn, [class*="button"]');
                for (const btn of toggleButtons) {
                    const text = btn.textContent?.toLowerCase() || '';
                    const aria = btn.getAttribute('aria-label')?.toLowerCase() || '';
                    if (text.includes('пользователи') || text.includes('users') || 
                        aria.includes('пользователи') || aria.includes('users') ||
                        text.includes('чат') || text.includes('chat') ||
                        aria.includes('чат') || aria.includes('chat')) {
                        const rect = btn.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            info.rightPanelToggle = {
                                tagName: btn.tagName,
                                className: typeof btn.className === 'string' ? btn.className : '',
                                text: btn.textContent?.trim() || '',
                                ariaLabel: btn.getAttribute('aria-label') || '',
                                position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                            };
                            break;
                        }
                    }
                }

                return info;
            });

            console.log(`🧠 Браузер ${pageIndex + 1}: Анализ 4-панельной структуры завершен`);
            console.log(`   - Верхняя панель: ${layoutInfo.panels.top ? 'найдена' : 'не найдена'}`);
            console.log(`   - Левая панель: ${layoutInfo.panels.left ? 'найдена' : 'не найдена'}`);
            console.log(`   - Правая панель: ${layoutInfo.panels.right ? 'найдена' : 'не найдена'}`);
            console.log(`   - Центральная панель: ${layoutInfo.panels.center ? 'найдена' : 'не найдена'}`);
            console.log(`   - Кнопка профиля: ${layoutInfo.profileButton ? 'найдена' : 'не найдена'}`);
            console.log(`   - Кнопка правой панели: ${layoutInfo.rightPanelToggle ? 'найдена' : 'не найдена'}`);
            console.log(`   - Пользователи в правой панели: ${layoutInfo.panels.right?.users.length || 0}`);

            return layoutInfo;

        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка анализа 4-панельной структуры:`, error.message);
            return null;
        }
    }

    async getUserNameFromProfile(pageIndex) {
        console.log(`👤 Браузер ${pageIndex + 1}: Определение имени пользователя через профиль`);
        
        try {
            // Анализируем текущую структуру
            const layoutInfo = await this.analyzeFourPanelLayout(pageIndex);
            
            if (!layoutInfo.profileButton) {
                console.log(`❌ Браузер ${pageIndex + 1}: Кнопка профиля не найдена`);
                return null;
            }
            
            console.log(`🎯 Браузер ${pageIndex + 1}: Найдена кнопка профиля "${layoutInfo.profileButton.text}"`);
            
            // Кликаем по кнопке профиля
            const clickX = layoutInfo.profileButton.position.x + layoutInfo.profileButton.position.width / 2;
            const clickY = layoutInfo.profileButton.position.y + layoutInfo.profileButton.position.height / 2;
            console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по профилю (${clickX}, ${clickY})`);
            await this.pages[pageIndex].mouse.click(clickX, clickY);
            
            // Ждем открытия профиля
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.takeScreenshot(pageIndex, 'profile_opened');
            
            // Анализируем открывшийся профиль
            const profileInfo = await this.pages[pageIndex].evaluate(() => {
                const profileElements = document.querySelectorAll('[class*="profile"], [class*="user-info"], [class*="modal"], [class*="dialog"], [class*="drawer"]');
                const userInfo = [];
                
                profileElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        userInfo.push({
                            tagName: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.trim() || '',
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                    }
                });
                
                return userInfo;
            });
            
            console.log(`📋 Браузер ${pageIndex + 1}: Найдено ${profileInfo.length} элементов профиля`);
            
            // Ищем имя пользователя в профиле
            let userName = null;
            for (const element of profileInfo) {
                const text = element.text.toLowerCase();
                if (text.includes('гость') || text.includes('guest') || text.includes('пользователь') || text.includes('user')) {
                    // Очищаем имя от лишних символов
                    let cleanName = element.text.replace(/[ГТ]/g, '').replace(/\(Вы\)/g, '').trim();
                    if (cleanName && cleanName.length > 2) {
                        userName = cleanName;
                        break;
                    }
                }
            }
            
            if (userName) {
                console.log(`✅ Браузер ${pageIndex + 1}: Имя пользователя определено: "${userName}"`);
                
                // Закрываем профиль (кликаем вне модального окна или по кнопке закрытия)
                await this.pages[pageIndex].keyboard.press('Escape');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return userName;
            } else {
                console.log(`❌ Браузер ${pageIndex + 1}: Имя пользователя не найдено в профиле`);
                console.log(`   Содержимое профиля:`);
                profileInfo.forEach((element, index) => {
                    console.log(`   ${index + 1}. "${element.text}"`);
                });
                
                // Закрываем профиль
                await this.pages[pageIndex].keyboard.press('Escape');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return null;
            }
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка определения имени пользователя:`, error.message);
            return null;
        }
    }

    async ensureRightPanelVisible(pageIndex) {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверка видимости правой панели`);
        
        try {
            const layoutInfo = await this.analyzeFourPanelLayout(pageIndex);
            
            if (layoutInfo.panels.right) {
                console.log(`✅ Браузер ${pageIndex + 1}: Правая панель уже видна`);
                return true;
            }
            
            // Если правая панель не видна, ищем кнопку для её открытия
            if (layoutInfo.rightPanelToggle) {
                console.log(`🔄 Браузер ${pageIndex + 1}: Открываем правую панель`);
                
                const clickX = layoutInfo.rightPanelToggle.position.x + layoutInfo.rightPanelToggle.position.width / 2;
                const clickY = layoutInfo.rightPanelToggle.position.y + layoutInfo.rightPanelToggle.position.height / 2;
                console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по кнопке правой панели (${clickX}, ${clickY})`);
                await this.pages[pageIndex].mouse.click(clickX, clickY);
                
                // Ждем появления правой панели
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Проверяем, появилась ли правая панель
                const newLayoutInfo = await this.analyzeFourPanelLayout(pageIndex);
                if (newLayoutInfo.panels.right) {
                    console.log(`✅ Браузер ${pageIndex + 1}: Правая панель успешно открыта`);
                    return true;
                } else {
                    console.log(`❌ Браузер ${pageIndex + 1}: Правая панель не открылась`);
                    return false;
                }
            } else {
                console.log(`❌ Браузер ${pageIndex + 1}: Кнопка открытия правой панели не найдена`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка проверки правой панели:`, error.message);
            return false;
        }
    }

    async checkUserVisibilityInRightPanel(pageIndex, targetUserName) {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверка видимости пользователя "${targetUserName}" в правой панели`);
        
        try {
            // Убеждаемся, что правая панель видна
            const panelVisible = await this.ensureRightPanelVisible(pageIndex);
            if (!panelVisible) {
                console.log(`❌ Браузер ${pageIndex + 1}: Правая панель недоступна`);
                return { visible: false, reason: 'right_panel_not_available' };
            }
            
            // Анализируем правую панель
            const layoutInfo = await this.analyzeFourPanelLayout(pageIndex);
            
            if (!layoutInfo.panels.right) {
                console.log(`❌ Браузер ${pageIndex + 1}: Правая панель не найдена после попытки открытия`);
                return { visible: false, reason: 'right_panel_not_found' };
            }
            
            // Ищем целевого пользователя в правой панели
            const targetUser = layoutInfo.panels.right.users.find(user => {
                const userText = user.text.toLowerCase();
                const targetText = targetUserName.toLowerCase();
                return userText.includes(targetText) || targetText.includes(userText);
            });
            
            if (targetUser) {
                console.log(`✅ Браузер ${pageIndex + 1}: Пользователь "${targetUserName}" найден в правой панели`);
                console.log(`   - Текст: "${targetUser.text}"`);
                console.log(`   - Класс: ${targetUser.className}`);
                console.log(`   - Позиция: x=${targetUser.position.x}, y=${targetUser.position.y}`);
                return { 
                    visible: true, 
                    user: targetUser,
                    matchType: 'exact'
                };
            } else {
                console.log(`❌ Браузер ${pageIndex + 1}: Пользователь "${targetUserName}" не найден в правой панели`);
                console.log(`   Доступные пользователи в правой панели:`);
                layoutInfo.panels.right.users.forEach((user, index) => {
                    console.log(`   ${index + 1}. "${user.text}"`);
                });
                return { visible: false, reason: 'user_not_found', availableUsers: layoutInfo.panels.right.users };
            }
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка проверки видимости пользователя:`, error.message);
            return { visible: false, reason: 'error', error: error.message };
        }
    }

    async intelligentGuestLogin(pageIndex) {
        console.log(`\n🧠 Браузер ${pageIndex + 1}: Интеллектуальный гостевой вход`);
        
        // Анализируем начальное состояние
        const initialLayout = await this.analyzeFourPanelLayout(pageIndex);
        
        // Проверяем, не вошел ли уже пользователь
        if (initialLayout.panels.right && initialLayout.panels.right.users.length > 0) {
            console.log(`✅ Браузер ${pageIndex + 1}: Пользователь уже вошел в систему`);
            return { success: true, alreadyLoggedIn: true };
        }
        
        // Ищем кнопку гостевого входа
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
        const clickX = btn.x + btn.width / 2;
        const clickY = btn.y + btn.height / 2;
        console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${clickX}, ${clickY}) по кнопке "${btn.text}"`);
        await this.pages[pageIndex].mouse.click(clickX, clickY);
        
        // Ждем изменения состояния
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Проверяем результат входа
        const afterLayout = await this.analyzeFourPanelLayout(pageIndex);
        if (afterLayout.panels.right && afterLayout.panels.right.users.length > 0) {
            console.log(`✅ Браузер ${pageIndex + 1}: Гостевой вход выполнен успешно`);
            return { success: true, loginMethod: 'guest' };
        } else {
            console.log(`❌ Браузер ${pageIndex + 1}: Гостевой вход не выполнен`);
            return { success: false, reason: 'login_failed' };
        }
    }

    async runIntelligentTestFinal() {
        try {
            console.log('🧠 Запуск финального интеллектуального тестирования');
            
            // Шаг 1: Открываем приложение
            console.log('\n📋 Шаг 1: Открытие приложения');
            for (let i = 0; i < this.pages.length; i++) {
                await this.pages[i].goto('http://localhost:3000', { waitUntil: 'networkidle2' });
                console.log(`✅ Браузер ${i + 1}: Приложение открыто`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Шаг 2: Гостевой вход
            console.log('\n📋 Шаг 2: Гостевой вход');
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
            
            // Шаг 3: Определение имен пользователей через профиль
            console.log('\n📋 Шаг 3: Определение имен пользователей через профиль');
            for (let i = 0; i < this.pages.length; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                const userName = await this.getUserNameFromProfile(i);
                this.userNames[i] = userName;
                
                if (!userName) {
                    console.log(`❌ Браузер ${i + 1}: Не удалось определить имя пользователя`);
                    return false;
                }
            }
            
            // Шаг 4: Проверка видимости пользователей в правых панелях
            if (this.pages.length > 1) {
                console.log('\n📋 Шаг 4: Проверка видимости пользователей в правых панелях');
                
                for (let i = 0; i < this.pages.length; i++) {
                    for (let j = 0; j < this.pages.length; j++) {
                        if (i !== j) {
                            console.log(`\n🔍 Проверка: Браузер ${i + 1} видит пользователя "${this.userNames[j]}" из Браузера ${j + 1}`);
                            
                            const visibilityResult = await this.checkUserVisibilityInRightPanel(i, this.userNames[j]);
                            
                            if (visibilityResult.visible) {
                                console.log(`✅ Браузер ${i + 1} видит пользователя "${this.userNames[j]}" из Браузера ${j + 1}`);
                            } else {
                                console.log(`❌ Браузер ${i + 1} НЕ видит пользователя "${this.userNames[j]}" из Браузера ${j + 1}`);
                                console.log(`   Причина: ${visibilityResult.reason}`);
                            }
                        }
                    }
                }
            }
            
            console.log('\n🎉 Финальное интеллектуальное тестирование завершено!');
            console.log(`📊 Результаты:`);
            console.log(`   - Браузер 1: "${this.userNames[0]}"`);
            console.log(`   - Браузер 2: "${this.userNames[1]}"`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в финальном интеллектуальном тестировании:', error.message);
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

// Запуск финального интеллектуального анализатора
async function main() {
    const analyzer = new IntelligentUIAnalyzerFinal();
    
    try {
        await analyzer.init(2); // Запускаем 2 браузера с изолированными профилями
        const success = await analyzer.runIntelligentTestFinal();
        
        if (success) {
            console.log('\n✅ Финальное интеллектуальное тестирование прошло успешно!');
        } else {
            console.log('\n❌ Финальное интеллектуальное тестирование завершилось с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await analyzer.close();
    }
}

main().catch(console.error); 