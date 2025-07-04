const puppeteer = require('puppeteer');
const fs = require('fs');

class DebugFinalTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshotDir = 'test_screenshots';
        this.stepCounter = 0;
    }

    async init() {
        console.log('🔍 Инициализация отладчика финального теста...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                '--start-maximized', 
                '--no-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Включаем детальное логирование
        this.page.on('console', msg => console.log('📱 Браузер:', msg.text()));
        this.page.on('pageerror', error => console.log('❌ Ошибка страницы:', error.message));
        
        console.log('✅ Отладчик инициализирован');
    }

    async takeScreenshot(name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/debug_final_step${this.stepCounter.toString().padStart(2, '0')}_${name}.png`;
        await this.page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот сохранен: ${filename}`);
        return filename;
    }

    async analyzeDetailedState() {
        console.log('\n🔍 Детальный анализ состояния...');
        
        const stateInfo = await this.page.evaluate(() => {
            const info = {
                url: window.location.href,
                title: document.title,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                buttons: [],
                modals: [],
                panels: {
                    top: null,
                    left: null,
                    right: null,
                    center: null
                },
                profileElements: [],
                loginState: 'unknown',
                localStorage: {}
            };

            // АНАЛИЗ КНОПОК
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"], .btn, [class*="button"], [data-testid], [aria-label]'));
            allButtons.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const text = btn.textContent?.trim() || '';
                    const aria = btn.getAttribute('aria-label') || '';
                    const testid = btn.getAttribute('data-testid') || '';
                    const className = typeof btn.className === 'string' ? btn.className : '';
                    const disabled = btn.disabled;
                    const visible = rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0;
                    
                    info.buttons.push({
                        text: text,
                        ariaLabel: aria,
                        dataTestId: testid,
                        className: className,
                        disabled: disabled,
                        visible: visible,
                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
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
                    
                    const userElements = el.querySelectorAll('[class*="user"], [class*="profile"], [data-testid*="user"], [class*="avatar"], [class*="list-item"], [class*="chat-item"]');
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

            // АНАЛИЗ ЭЛЕМЕНТОВ ПРОФИЛЯ
            const profileElements = document.querySelectorAll('[class*="avatar"], [class*="profile"], [class*="user-info"], [class*="current-user"]');
            profileElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    info.profileElements.push({
                        tagName: el.tagName,
                        className: typeof el.className === 'string' ? el.className : '',
                        text: el.textContent?.trim() || '',
                        ariaLabel: el.getAttribute('aria-label') || '',
                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    });
                }
            });

            // ОПРЕДЕЛЕНИЕ СОСТОЯНИЯ ВХОДА
            if (info.panels.right && info.panels.right.users.length > 0) {
                info.loginState = 'logged_in';
            } else if (info.modals.length > 0) {
                info.loginState = 'modal_open';
            } else if (info.buttons.some(btn => btn.text.toLowerCase().includes('войти') || btn.text.toLowerCase().includes('login'))) {
                info.loginState = 'login_required';
            } else {
                info.loginState = 'unknown';
            }

            // АНАЛИЗ LOCAL STORAGE
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        info.localStorage[key] = localStorage.getItem(key);
                    }
                }
            } catch (e) {
                info.localStorage = { error: e.message };
            }

            return info;
        });

        console.log(`🔍 Анализ состояния завершен:`);
        console.log(`   - URL: ${stateInfo.url}`);
        console.log(`   - Заголовок: ${stateInfo.title}`);
        console.log(`   - Состояние входа: ${stateInfo.loginState}`);
        console.log(`   - Кнопки: ${stateInfo.buttons.length}`);
        console.log(`   - Модальные окна: ${stateInfo.modals.length}`);
        console.log(`   - Элементы профиля: ${stateInfo.profileElements.length}`);
        console.log(`   - Верхняя панель: ${stateInfo.panels.top ? 'найдена' : 'не найдена'}`);
        console.log(`   - Правая панель: ${stateInfo.panels.right ? 'найдена' : 'не найдена'}`);
        console.log(`   - Центральная панель: ${stateInfo.panels.center ? 'найдена' : 'не найдена'}`);
        console.log(`   - LocalStorage ключи: ${Object.keys(stateInfo.localStorage).length}`);

        // Выводим детали кнопок
        console.log(`\n📋 Кнопки (первые 15):`);
        stateInfo.buttons.slice(0, 15).forEach((btn, index) => {
            console.log(`   ${index + 1}. "${btn.text}" (${btn.ariaLabel}) - ${btn.visible ? 'видима' : 'невидима'} - ${btn.disabled ? 'отключена' : 'активна'}`);
        });

        // Выводим детали элементов профиля
        if (stateInfo.profileElements.length > 0) {
            console.log(`\n📋 Элементы профиля:`);
            stateInfo.profileElements.forEach((element, index) => {
                console.log(`   ${index + 1}. ${element.tagName}.${element.className} - "${element.text}" (${element.ariaLabel})`);
            });
        }

        // Выводим LocalStorage
        if (Object.keys(stateInfo.localStorage).length > 0) {
            console.log(`\n📋 LocalStorage:`);
            Object.entries(stateInfo.localStorage).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
            });
        }

        return stateInfo;
    }

    async debugFinalTest() {
        try {
            console.log('🔍 Запуск отладки финального теста');
            
            // Шаг 1: Открываем приложение
            console.log('\n📋 Шаг 1: Открытие приложения');
            await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            console.log('✅ Приложение открыто');
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.takeScreenshot('initial');
            
            // Шаг 2: Анализируем начальное состояние
            console.log('\n📋 Шаг 2: Анализ начального состояния');
            const initialState = await this.analyzeDetailedState();
            
            // Шаг 3: Ищем кнопку гостевого входа
            console.log('\n📋 Шаг 3: Поиск кнопки гостевого входа');
            const guestButton = initialState.buttons.find(btn => {
                const text = btn.text.toLowerCase();
                const aria = btn.ariaLabel.toLowerCase();
                return (text.includes('гость') && text.includes('продолжить')) ||
                       (aria.includes('гость') && aria.includes('продолжить')) ||
                       (text.includes('guest') && text.includes('continue')) ||
                       (aria.includes('guest') && aria.includes('continue'));
            });
            
            if (!guestButton) {
                console.log('❌ Кнопка гостевого входа не найдена');
                console.log('Доступные кнопки:');
                initialState.buttons.forEach((btn, index) => {
                    console.log(`${index + 1}. "${btn.text}" (${btn.ariaLabel})`);
                });
                return false;
            }
            
            console.log(`🎯 Найдена кнопка гостевого входа: "${guestButton.text}"`);
            console.log(`   - Aria-label: "${guestButton.ariaLabel}"`);
            console.log(`   - Класс: ${guestButton.className}`);
            console.log(`   - Видима: ${guestButton.visible}`);
            console.log(`   - Отключена: ${guestButton.disabled}`);
            console.log(`   - Позиция: x=${guestButton.position.x}, y=${guestButton.position.y}`);
            
            // Шаг 4: Кликаем по кнопке гостевого входа
            console.log('\n📋 Шаг 4: Клик по кнопке гостевого входа');
            const clickX = guestButton.position.x + guestButton.position.width / 2;
            const clickY = guestButton.position.y + guestButton.position.height / 2;
            console.log(`🖱️ Клик по координатам (${clickX}, ${clickY})`);
            
            await this.page.mouse.click(clickX, clickY);
            
            // Ждем изменения состояния
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.takeScreenshot('after_guest_click');
            
            // Шаг 5: Анализируем состояние после клика
            console.log('\n📋 Шаг 5: Анализ состояния после клика');
            const afterClickState = await this.analyzeDetailedState();
            
            // Шаг 6: Ищем кнопку профиля
            console.log('\n📋 Шаг 6: Поиск кнопки профиля');
            const profileButton = afterClickState.buttons.find(btn => {
                const text = btn.text.toLowerCase();
                const aria = btn.ariaLabel.toLowerCase();
                const className = btn.className.toLowerCase();
                return className.includes('avatar') || 
                       className.includes('profile') || 
                       aria.includes('профиль') || 
                       aria.includes('profile') ||
                       text.includes('(вы)') ||
                       text.includes('(you)');
            });
            
            if (profileButton) {
                console.log(`🎯 Найдена кнопка профиля: "${profileButton.text}"`);
                console.log(`   - Aria-label: "${profileButton.ariaLabel}"`);
                console.log(`   - Класс: ${profileButton.className}`);
                console.log(`   - Позиция: x=${profileButton.position.x}, y=${profileButton.position.y}`);
                
                // Шаг 7: Кликаем по кнопке профиля
                console.log('\n📋 Шаг 7: Клик по кнопке профиля');
                const profileClickX = profileButton.position.x + profileButton.position.width / 2;
                const profileClickY = profileButton.position.y + profileButton.position.height / 2;
                console.log(`🖱️ Клик по профилю (${profileClickX}, ${profileClickY})`);
                
                await this.page.mouse.click(profileClickX, profileClickY);
                
                // Ждем открытия профиля
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.takeScreenshot('profile_opened');
                
                // Шаг 8: Анализируем профиль
                console.log('\n📋 Шаг 8: Анализ профиля');
                const profileState = await this.analyzeDetailedState();
                
                // Ищем имя пользователя в модальном окне профиля
                if (profileState.modals.length > 0) {
                    console.log('📋 Модальные окна профиля:');
                    profileState.modals.forEach((modal, index) => {
                        console.log(`   ${index + 1}. ${modal.tagName}.${modal.className} - "${modal.text}"`);
                    });
                }
                
                // Закрываем профиль
                await this.page.keyboard.press('Escape');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } else {
                console.log('❌ Кнопка профиля не найдена');
                console.log('Доступные кнопки после входа:');
                afterClickState.buttons.forEach((btn, index) => {
                    console.log(`${index + 1}. "${btn.text}" (${btn.ariaLabel}) - ${btn.className}`);
                });
            }
            
            console.log('\n✅ Отладка финального теста завершена');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка в отладке финального теста:', error.message);
            return false;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }
}

// Запуск отладчика
async function main() {
    const debugInstance = new DebugFinalTest();
    
    try {
        await debugInstance.init();
        const success = await debugInstance.debugFinalTest();
        
        if (success) {
            console.log('\n✅ Отладка финального теста завершена успешно!');
        } else {
            console.log('\n❌ Отладка финального теста завершена с ошибками');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    } finally {
        await debugInstance.close();
    }
}

main().catch(console.error); 