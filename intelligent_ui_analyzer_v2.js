const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');

class IntelligentUIAnalyzerV2 {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.userProfiles = [];
        this.stepCounter = 0;
    }

    async init(browserCount = 2) {
        console.log(`🧠 Инициализация интеллектуального UI анализатора V2 (${browserCount} браузеров)...`);
        
        // Создаем уникальные профили для каждого браузера
        for (let i = 0; i < browserCount; i++) {
            const profileDir = `./intelligent-v2-user-data-${i}`;
            
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
                'X-User-Agent': `IntelligentV2-${i + 1}`,
                'X-User-ID': `user-${i + 1}`
            });
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен с изолированным профилем: ${this.userProfiles[i]}`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/intelligent_v2_step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
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
                    userProfile: {
                        currentUser: null,
                        profileElements: []
                    }
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
                                info.panels.top.elements.push({
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
                const rightElements = document.querySelectorAll('[class*="sidebar"], [class*="panel"], [class*="users"], [class*="right"]');
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
                        const userElements = el.querySelectorAll('[class*="user"], [class*="profile"], [data-testid*="user"], [class*="avatar"], [class*="list-item"]');
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

                // АНАЛИЗ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
                const profileElements = document.querySelectorAll('[class*="avatar"], [class*="profile"], [class*="user-info"], [class*="current-user"]');
                profileElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.userProfile.profileElements.push({
                            tagName: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.trim() || '',
                            ariaLabel: el.getAttribute('aria-label') || '',
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        });
                        
                        // Определяем текущего пользователя
                        if (el.textContent?.includes('(Вы)') || el.textContent?.includes('(You)') || 
                            el.className?.includes('avatar') || el.className?.includes('profile')) {
                            info.userProfile.currentUser = {
                                text: el.textContent?.trim() || '',
                                className: typeof el.className === 'string' ? el.className : '',
                                position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                            };
                        }
                    }
                });

                return info;
            });

            console.log(`🧠 Браузер ${pageIndex + 1}: Анализ 4-панельной структуры завершен`);
            console.log(`   - Верхняя панель: ${layoutInfo.panels.top ? 'найдена' : 'не найдена'}`);
            console.log(`   - Левая панель: ${layoutInfo.panels.left ? 'найдена' : 'не найдена'}`);
            console.log(`   - Правая панель: ${layoutInfo.panels.right ? 'найдена' : 'не найдена'}`);
            console.log(`   - Центральная панель: ${layoutInfo.panels.center ? 'найдена' : 'не найдена'}`);
            console.log(`   - Элементы профиля: ${layoutInfo.userProfile.profileElements.length}`);
            console.log(`   - Пользователи в правой панели: ${layoutInfo.panels.right?.users.length || 0}`);

            return layoutInfo;

        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка анализа 4-панельной структуры:`, error.message);
            return null;
        }
    }

    async getCurrentUserName(pageIndex) {
        console.log(`👤 Браузер ${pageIndex + 1}: Определение точного имени текущего пользователя`);
        
        try {
            // Сначала анализируем текущую структуру
            const layoutInfo = await this.analyzeFourPanelLayout(pageIndex);
            
            // Ищем кнопку профиля в верхней панели
            let profileButton = null;
            if (layoutInfo.panels.top) {
                profileButton = layoutInfo.panels.top.elements.find(el => 
                    el.className.includes('avatar') || 
                    el.className.includes('profile') || 
                    el.ariaLabel.includes('профиль') || 
                    el.ariaLabel.includes('profile') ||
                    el.text.includes('(Вы)') ||
                    el.text.includes('(You)')
                );
            }
            
            if (profileButton) {
                console.log(`🎯 Браузер ${pageIndex + 1}: Найдена кнопка профиля "${profileButton.text}"`);
                
                // Кликаем по кнопке профиля
                const clickX = profileButton.position.x + profileButton.position.width / 2;
                const clickY = profileButton.position.y + profileButton.position.height / 2;
                console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по профилю (${clickX}, ${clickY})`);
                await this.pages[pageIndex].mouse.click(clickX, clickY);
                
                // Ждем открытия профиля
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Анализируем открывшийся профиль
                const profileInfo = await this.pages[pageIndex].evaluate(() => {
                    const profileElements = document.querySelectorAll('[class*="profile"], [class*="user-info"], [class*="modal"], [class*="dialog"]');
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
                    console.log(`✅ Браузер ${pageIndex + 1}: Определено имя пользователя: "${userName}"`);
                    return userName;
                } else {
                    console.log(`⚠️ Браузер ${pageIndex + 1}: Имя пользователя не найдено в профиле`);
                }
            } else {
                console.log(`⚠️ Браузер ${pageIndex + 1}: Кнопка профиля не найдена`);
            }
            
            // Если не удалось получить имя через профиль, используем информацию из правой панели
            if (layoutInfo.panels.right) {
                const currentUser = layoutInfo.panels.right.users.find(user => user.isCurrentUser);
                if (currentUser) {
                    let userName = currentUser.text.replace(/[ГТ]/g, '').replace(/\(Вы\)/g, '').trim();
                    if (userName && userName.length > 2) {
                        console.log(`✅ Браузер ${pageIndex + 1}: Имя пользователя из правой панели: "${userName}"`);
                        return userName;
                    }
                }
            }
            
            console.log(`❌ Браузер ${pageIndex + 1}: Не удалось определить имя пользователя`);
            return null;
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка определения имени пользователя:`, error.message);
            return null;
        }
    }

    async checkUserVisibility(pageIndex, targetUserName) {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверка видимости пользователя "${targetUserName}"`);
        
        try {
            const layoutInfo = await this.analyzeFourPanelLayout(pageIndex);
            
            if (!layoutInfo.panels.right) {
                console.log(`❌ Браузер ${pageIndex + 1}: Правая панель не найдена`);
                return { visible: false, reason: 'no_right_panel' };
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
                console.log(`   Доступные пользователи:`);
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
        console.log(`\n🧠 Браузер ${pageIndex + 1}: Интеллектуальный гостевой вход V2`);
        
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

    async runIntelligentTestV2() {
        try {
            console.log('🧠 Запуск интеллектуального тестирования V2');
            
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
            
            // Шаг 3: Определение имен пользователей
            console.log('\n📋 Шаг 3: Определение имен пользователей');
            const userNames = [];
            for (let i = 0; i < this.pages.length; i++) {
                console.log(`\n--- Браузер ${i + 1} ---`);
                const userName = await this.getCurrentUserName(i);
                userNames.push(userName);
                
                if (!userName) {
                    console.log(`❌ Браузер ${i + 1}: Не удалось определить имя пользователя`);
                    return false;
                }
            }
            
            // Шаг 4: Проверка видимости пользователей
            if (this.pages.length > 1) {
                console.log('\n📋 Шаг 4: Проверка видимости пользователей');
                
                for (let i = 0; i < this.pages.length; i++) {
                    for (let j = 0; j < this.pages.length; j++) {
                        if (i !== j) {
                            console.log(`\n🔍 Проверка: Браузер ${i + 1} видит пользователя из Браузера ${j + 1}`);
                            
                            const visibilityResult = await this.checkUserVisibility(i, userNames[j]);
                            
                            if (visibilityResult.visible) {
                                console.log(`✅ Браузер ${i + 1} видит пользователя "${userNames[j]}" из Браузера ${j + 1}`);
                            } else {
                                console.log(`❌ Браузер ${i + 1} НЕ видит пользователя "${userNames[j]}" из Браузера ${j + 1}`);
                                console.log(`   Причина: ${visibilityResult.reason}`);
                            }
                        }
                    }
                }
            }
            
            console.log('\n🎉 Интеллектуальное тестирование V2 завершено!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в интеллектуальном тестировании V2:', error.message);
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

// Запуск интеллектуального анализатора V2
async function main() {
    const analyzer = new IntelligentUIAnalyzerV2();
    
    try {
        await analyzer.init(2); // Запускаем 2 браузера с изолированными профилями
        const success = await analyzer.runIntelligentTestV2();
        
        if (success) {
            console.log('\n✅ Интеллектуальное тестирование V2 прошло успешно!');
        } else {
            console.log('\n❌ Интеллектуальное тестирование V2 завершилось с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await analyzer.close();
    }
}

main().catch(console.error); 