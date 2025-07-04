const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const fs = require('fs');

class IntelligentUIAnalyzerV3 {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.tesseractPath = '"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"';
        this.screenshotDir = 'test_screenshots';
        this.userProfiles = [];
        this.stepCounter = 0;
    }

    async init(browserCount = 2) {
        console.log(`🧠 Инициализация интеллектуального UI анализатора V3 (${browserCount} браузеров)...`);
        
        // Создаем уникальные профили для каждого браузера
        for (let i = 0; i < browserCount; i++) {
            const profileDir = `./intelligent-v3-user-data-${i}`;
            
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
                'X-User-Agent': `IntelligentV3-${i + 1}`,
                'X-User-ID': `user-${i + 1}`
            });
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен с изолированным профилем: ${this.userProfiles[i]}`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/intelligent_v3_step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
        await this.pages[pageIndex].screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот браузера ${pageIndex + 1} сохранен: ${filename}`);
        return filename;
    }

    async analyzeCurrentState(pageIndex) {
        console.log(`🔍 Браузер ${pageIndex + 1}: Детальный анализ текущего состояния`);
        
        try {
            const stateInfo = await this.pages[pageIndex].evaluate(() => {
                const info = {
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    panels: {
                        top: null,
                        left: null,
                        right: null,
                        center: null
                    },
                    modals: [],
                    buttons: [],
                    currentUser: null,
                    loginState: 'unknown'
                };

                // АНАЛИЗ ВСЕХ КНОПОК
                const allButtons = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"], [data-testid], [aria-label]'));
                allButtons.forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const text = btn.textContent?.trim() || '';
                        const aria = btn.getAttribute('aria-label') || '';
                        const testid = btn.getAttribute('data-testid') || '';
                        const className = typeof btn.className === 'string' ? btn.className : '';
                        
                        info.buttons.push({
                            text: text,
                            ariaLabel: aria,
                            dataTestId: testid,
                            className: className,
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            visible: rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0
                        });
                    }
                });

                // АНАЛИЗ МОДАЛЬНЫХ ОКОН
                const modals = document.querySelectorAll('[class*="modal"], [class*="dialog"], [class*="popup"], [role="dialog"]');
                modals.forEach(modal => {
                    const rect = modal.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        info.modals.push({
                            tagName: modal.tagName,
                            className: typeof modal.className === 'string' ? modal.className : '',
                            text: modal.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                            visible: rect.width > 0 && rect.height > 0
                        });
                    }
                });

                // АНАЛИЗ ПАНЕЛЕЙ
                const topElements = document.querySelectorAll('header, [class*="header"], [class*="app-bar"], [class*="top"], [class*="navbar"]');
                for (const el of topElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && rect.y < window.innerHeight * 0.2) {
                        info.panels.top = {
                            element: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                        break;
                    }
                }

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
                                    position: { x: userRect.x, y: userRect.y, width: userRect.width, height: userRect.height },
                                    isCurrentUser: user.textContent?.includes('(Вы)') || user.textContent?.includes('(You)') || false
                                });
                            }
                        });
                        break;
                    }
                }

                const centerElements = document.querySelectorAll('main, [class*="main"], [class*="content"], [class*="feed"], [class*="center"]');
                for (const el of centerElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && 
                        rect.x > window.innerWidth * 0.2 && rect.x < window.innerWidth * 0.6) {
                        info.panels.center = {
                            element: el.tagName,
                            className: typeof el.className === 'string' ? el.className : '',
                            text: el.textContent?.substring(0, 200),
                            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                        };
                        break;
                    }
                }

                // ОПРЕДЕЛЕНИЕ СОСТОЯНИЯ ВХОДА
                if (info.panels.right && info.panels.right.users.length > 0) {
                    info.loginState = 'logged_in';
                    const currentUser = info.panels.right.users.find(user => user.isCurrentUser);
                    if (currentUser) {
                        info.currentUser = currentUser.text;
                    }
                } else if (info.modals.length > 0) {
                    info.loginState = 'modal_open';
                } else if (info.buttons.some(btn => btn.text.toLowerCase().includes('войти') || btn.text.toLowerCase().includes('login'))) {
                    info.loginState = 'login_required';
                } else {
                    info.loginState = 'unknown';
                }

                return info;
            });

            console.log(`🔍 Браузер ${pageIndex + 1}: Состояние анализа завершено`);
            console.log(`   - Состояние входа: ${stateInfo.loginState}`);
            console.log(`   - Кнопки найдено: ${stateInfo.buttons.length}`);
            console.log(`   - Модальные окна: ${stateInfo.modals.length}`);
            console.log(`   - Верхняя панель: ${stateInfo.panels.top ? 'найдена' : 'не найдена'}`);
            console.log(`   - Правая панель: ${stateInfo.panels.right ? 'найдена' : 'не найдена'}`);
            console.log(`   - Центральная панель: ${stateInfo.panels.center ? 'найдена' : 'не найдена'}`);
            console.log(`   - Текущий пользователь: ${stateInfo.currentUser || 'не определен'}`);

            return stateInfo;

        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка анализа состояния:`, error.message);
            return null;
        }
    }

    async intelligentGuestLoginV3(pageIndex) {
        console.log(`\n🧠 Браузер ${pageIndex + 1}: Интеллектуальный гостевой вход V3`);
        
        // Анализируем начальное состояние
        const initialState = await this.analyzeCurrentState(pageIndex);
        
        if (initialState.loginState === 'logged_in') {
            console.log(`✅ Браузер ${pageIndex + 1}: Пользователь уже вошел в систему`);
            return { success: true, alreadyLoggedIn: true, user: initialState.currentUser };
        }
        
        // Ищем кнопку гостевого входа
        const guestButton = initialState.buttons.find(btn => {
            const text = btn.text.toLowerCase();
            const aria = btn.ariaLabel.toLowerCase();
            return (text.includes('гость') && text.includes('продолжить')) ||
                   (aria.includes('гость') && aria.includes('продолжить')) ||
                   (text.includes('guest') && text.includes('continue')) ||
                   (aria.includes('guest') && aria.includes('continue'));
        });
        
        if (!guestButton) {
            console.log(`❌ Браузер ${pageIndex + 1}: Кнопка гостевого входа не найдена`);
            console.log(`   Доступные кнопки:`);
            initialState.buttons.forEach((btn, index) => {
                console.log(`   ${index + 1}. "${btn.text}" (${btn.ariaLabel})`);
            });
            return { success: false, reason: 'no_guest_button_found' };
        }
        
        console.log(`🎯 Браузер ${pageIndex + 1}: Найдена кнопка гостевого входа "${guestButton.text}"`);
        
        // Кликаем по кнопке гостевого входа
        const clickX = guestButton.position.x + guestButton.position.width / 2;
        const clickY = guestButton.position.y + guestButton.position.height / 2;
        console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по координатам (${clickX}, ${clickY})`);
        await this.pages[pageIndex].mouse.click(clickX, clickY);
        
        // Ждем изменения состояния
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Анализируем состояние после клика
        const afterClickState = await this.analyzeCurrentState(pageIndex);
        
        // Если появилось модальное окно, обрабатываем его
        if (afterClickState.loginState === 'modal_open') {
            console.log(`📋 Браузер ${pageIndex + 1}: Открылось модальное окно, обрабатываем...`);
            
            // Ищем кнопку EMAIL в модальном окне
            const emailButton = afterClickState.buttons.find(btn => {
                const text = btn.text.toLowerCase();
                const aria = btn.ariaLabel.toLowerCase();
                return text.includes('email') || aria.includes('email') || text.includes('почта') || aria.includes('почта');
            });
            
            if (emailButton) {
                console.log(`📧 Браузер ${pageIndex + 1}: Найдена кнопка EMAIL "${emailButton.text}"`);
                
                const emailClickX = emailButton.position.x + emailButton.position.width / 2;
                const emailClickY = emailButton.position.y + emailButton.position.height / 2;
                console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по EMAIL (${emailClickX}, ${emailClickY})`);
                await this.pages[pageIndex].mouse.click(emailClickX, emailClickY);
                
                // Ждем обработки
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Проверяем финальное состояние
                const finalState = await this.analyzeCurrentState(pageIndex);
                
                if (finalState.loginState === 'logged_in') {
                    console.log(`✅ Браузер ${pageIndex + 1}: Гостевой вход через EMAIL выполнен успешно`);
                    return { success: true, loginMethod: 'guest_email', user: finalState.currentUser };
                } else {
                    console.log(`❌ Браузер ${pageIndex + 1}: Гостевой вход через EMAIL не выполнен`);
                    return { success: false, reason: 'email_login_failed' };
                }
            } else {
                console.log(`❌ Браузер ${pageIndex + 1}: Кнопка EMAIL не найдена в модальном окне`);
                return { success: false, reason: 'no_email_button_in_modal' };
            }
        } else if (afterClickState.loginState === 'logged_in') {
            console.log(`✅ Браузер ${pageIndex + 1}: Гостевой вход выполнен успешно`);
            return { success: true, loginMethod: 'direct_guest', user: afterClickState.currentUser };
        } else {
            console.log(`❌ Браузер ${pageIndex + 1}: Гостевой вход не выполнен`);
            return { success: false, reason: 'login_failed_after_click' };
        }
    }

    async getCurrentUserNameV3(pageIndex) {
        console.log(`👤 Браузер ${pageIndex + 1}: Определение точного имени текущего пользователя V3`);
        
        try {
            const stateInfo = await this.analyzeCurrentState(pageIndex);
            
            if (stateInfo.currentUser) {
                console.log(`✅ Браузер ${pageIndex + 1}: Имя пользователя определено: "${stateInfo.currentUser}"`);
                return stateInfo.currentUser;
            }
            
            // Если не найдено в правой панели, ищем в верхней панели
            if (stateInfo.panels.top) {
                const profileButton = stateInfo.buttons.find(btn => 
                    btn.className.includes('avatar') || 
                    btn.className.includes('profile') || 
                    btn.ariaLabel.includes('профиль') || 
                    btn.ariaLabel.includes('profile')
                );
                
                if (profileButton) {
                    console.log(`🎯 Браузер ${pageIndex + 1}: Найдена кнопка профиля "${profileButton.text}"`);
                    
                    // Кликаем по кнопке профиля
                    const clickX = profileButton.position.x + profileButton.position.width / 2;
                    const clickY = profileButton.position.y + profileButton.position.height / 2;
                    console.log(`🖱️ Браузер ${pageIndex + 1}: Клик по профилю (${clickX}, ${clickY})`);
                    await this.pages[pageIndex].mouse.click(clickX, clickY);
                    
                    // Ждем открытия профиля
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Анализируем профиль
                    const profileState = await this.analyzeCurrentState(pageIndex);
                    
                    // Ищем имя в модальном окне профиля
                    if (profileState.modals.length > 0) {
                        for (const modal of profileState.modals) {
                            if (modal.text.toLowerCase().includes('гость') || modal.text.toLowerCase().includes('guest')) {
                                const userName = modal.text.replace(/[ГТ]/g, '').replace(/\(Вы\)/g, '').trim();
                                if (userName && userName.length > 2) {
                                    console.log(`✅ Браузер ${pageIndex + 1}: Имя пользователя из профиля: "${userName}"`);
                                    return userName;
                                }
                            }
                        }
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

    async checkUserVisibilityV3(pageIndex, targetUserName) {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверка видимости пользователя "${targetUserName}" V3`);
        
        try {
            const stateInfo = await this.analyzeCurrentState(pageIndex);
            
            if (!stateInfo.panels.right) {
                console.log(`❌ Браузер ${pageIndex + 1}: Правая панель не найдена`);
                return { visible: false, reason: 'no_right_panel' };
            }
            
            // Ищем целевого пользователя в правой панели
            const targetUser = stateInfo.panels.right.users.find(user => {
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
                stateInfo.panels.right.users.forEach((user, index) => {
                    console.log(`   ${index + 1}. "${user.text}"`);
                });
                return { visible: false, reason: 'user_not_found', availableUsers: stateInfo.panels.right.users };
            }
            
        } catch (error) {
            console.error(`❌ Браузер ${pageIndex + 1}: Ошибка проверки видимости пользователя:`, error.message);
            return { visible: false, reason: 'error', error: error.message };
        }
    }

    async runIntelligentTestV3() {
        try {
            console.log('🧠 Запуск интеллектуального тестирования V3');
            
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
                const loginResult = await this.intelligentGuestLoginV3(i);
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
                const userName = await this.getCurrentUserNameV3(i);
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
                            
                            const visibilityResult = await this.checkUserVisibilityV3(i, userNames[j]);
                            
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
            
            console.log('\n🎉 Интеллектуальное тестирование V3 завершено!');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в интеллектуальном тестировании V3:', error.message);
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

// Запуск интеллектуального анализатора V3
async function main() {
    const analyzer = new IntelligentUIAnalyzerV3();
    
    try {
        await analyzer.init(2); // Запускаем 2 браузера с изолированными профилями
        const success = await analyzer.runIntelligentTestV3();
        
        if (success) {
            console.log('\n✅ Интеллектуальное тестирование V3 прошло успешно!');
        } else {
            console.log('\n❌ Интеллектуальное тестирование V3 завершилось с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await analyzer.close();
    }
}

main().catch(console.error); 