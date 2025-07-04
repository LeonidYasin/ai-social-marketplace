const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class IntelligentUIAnalyzer {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.userNames = [];
        this.screenshotsDir = 'test_screenshots/intelligent_final';
        
        // Создаем директорию для скриншотов
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
        }
    }

    async initialize() {
        console.log('🧠 Инициализация интеллектуального анализатора UI (Финальная версия)...');
        
        // Запускаем два браузера с изолированными профилями
        for (let i = 0; i < 2; i++) {
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1920, height: 1080 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    `--user-data-dir=./browser_profile_${i}`
                ]
            });
            
            const page = await browser.newPage();
            
            // Включаем логирование
            page.on('console', msg => {
                console.log(`📱 Браузер ${i + 1}: ${msg.text()}`);
            });
            
            this.browsers.push(browser);
            this.pages.push(page);
        }
        
        console.log('✅ Интеллектуальный анализатор инициализирован');
    }

    async analyzeState(page, stepName) {
        console.log(`\n📋 Анализ состояния: ${stepName}`);
        
        const state = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
                text: btn.textContent?.trim() || '',
                ariaLabel: btn.getAttribute('aria-label') || '',
                className: btn.className || '',
                visible: btn.offsetParent !== null,
                disabled: btn.disabled,
                position: btn.getBoundingClientRect()
            }));
            
            const modals = document.querySelectorAll('[role="dialog"], .MuiModal-root, .modal, .popup');
            const profileElements = document.querySelectorAll('[data-testid*="profile"], [class*="profile"], [id*="profile"]');
            
            // Поиск панелей
            const topPanel = document.querySelector('header, .header, .top-panel, .app-bar');
            const rightPanel = document.querySelector('.sidebar-right, .right-panel, [data-testid="sidebar-right"]');
            const centerPanel = document.querySelector('main, .main, .center-panel, .content');
            
            // LocalStorage
            const localStorage = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    localStorage[key] = localStorage.getItem(key);
                }
            }
            
            return {
                url: window.location.href,
                title: document.title,
                buttons: buttons.slice(0, 20), // Первые 20 кнопок
                modalsCount: modals.length,
                profileElementsCount: profileElements.length,
                topPanel: !!topPanel,
                rightPanel: !!rightPanel,
                centerPanel: !!centerPanel,
                localStorage: localStorage
            };
        });
        
        console.log(`🔍 Анализ состояния завершен:
   - URL: ${state.url}
   - Заголовок: ${state.title}
   - Кнопки: ${state.buttons.length}
   - Модальные окна: ${state.modalsCount}
   - Элементы профиля: ${state.profileElementsCount}
   - Верхняя панель: ${state.topPanel ? 'найдена' : 'не найдена'}
   - Правая панель: ${state.rightPanel ? 'найдена' : 'не найдена'}
   - Центральная панель: ${state.centerPanel ? 'найдена' : 'не найдена'}
   - LocalStorage ключи: ${Object.keys(state.localStorage).length}`);
        
        return state;
    }

    async extractUserNamesFromProfile(page, browserIndex) {
        console.log(`\n📋 Извлечение имен пользователей из профиля (Браузер ${browserIndex + 1})`);
        
        // Ищем кнопку профиля по тексту
        const profileButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => {
                const text = btn.textContent?.trim() || '';
                return text.includes('Пользователи') || text.includes('(Вы)') || text.includes('Гость');
            });
        });
        
        if (!profileButton || await profileButton.evaluate(btn => !btn)) {
            console.log('❌ Кнопка профиля не найдена');
            return null;
        }
        
        // Получаем текст кнопки профиля
        const profileText = await profileButton.evaluate(btn => btn.textContent?.trim() || '');
        console.log(`📋 Текст профиля: ${profileText.substring(0, 200)}...`);
        
        // Извлекаем имена пользователей из текста
        const userNames = this.extractUserNamesFromText(profileText);
        console.log(`👥 Найдено пользователей: ${userNames.length}`);
        
        // Находим текущего пользователя (помеченного "(Вы)")
        const currentUser = userNames.find(name => name.includes('(Вы)'));
        if (currentUser) {
            const cleanName = currentUser.replace(' (Вы)', '').trim();
            console.log(`👤 Текущий пользователь: ${cleanName}`);
            this.userNames[browserIndex] = cleanName;
        }
        
        return userNames;
    }

    extractUserNamesFromText(text) {
        // Разбиваем текст на строки и ищем имена пользователей
        const lines = text.split('\n').filter(line => line.trim());
        const userNames = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            // Ищем строки, содержащие имена пользователей
            if (trimmed.includes('Гость') || 
                trimmed.includes('Пользователь') || 
                trimmed.includes('User') ||
                trimmed.includes('Тест') ||
                trimmed.includes('Admin') ||
                trimmed.includes('Модератор') ||
                trimmed.includes('Премиум') ||
                trimmed.includes('Обычный') ||
                trimmed.includes('Security') ||
                trimmed.includes('(Вы)')) {
                userNames.push(trimmed);
            }
        }
        
        return userNames;
    }

    async checkUserVisibility(page, targetUserName, browserIndex) {
        console.log(`\n🔍 Проверка видимости пользователя "${targetUserName}" в браузере ${browserIndex + 1}`);
        
        // Получаем список пользователей из профиля
        const userNames = await this.extractUserNamesFromProfile(page, browserIndex);
        
        if (!userNames) {
            console.log('❌ Не удалось получить список пользователей');
            return false;
        }
        
        // Проверяем, есть ли целевой пользователь в списке
        const isVisible = userNames.some(name => 
            name.includes(targetUserName) || 
            name.replace(' (Вы)', '').trim() === targetUserName
        );
        
        console.log(`👥 Пользователь "${targetUserName}" ${isVisible ? 'виден' : 'не виден'} в браузере ${browserIndex + 1}`);
        return isVisible;
    }

    async takeScreenshot(page, filename) {
        const filepath = path.join(this.screenshotsDir, filename);
        await page.screenshot({ 
            path: filepath, 
            fullPage: true 
        });
        console.log(`📸 Скриншот сохранен: ${filepath}`);
    }

    async runTest() {
        try {
            console.log('🚀 Запуск финального интеллектуального теста...');
            
            // Шаг 1: Открываем приложение в обоих браузерах
            console.log('\n📋 Шаг 1: Открытие приложения');
            for (let i = 0; i < this.pages.length; i++) {
                await this.pages[i].goto('http://localhost:3000', { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
                await this.takeScreenshot(this.pages[i], `step01_browser${i + 1}_initial.png`);
            }
            
            // Шаг 2: Гостевой вход в обоих браузерах
            console.log('\n📋 Шаг 2: Гостевой вход');
            for (let i = 0; i < this.pages.length; i++) {
                console.log(`\n🔄 Браузер ${i + 1}: Гостевой вход`);
                
                // Ищем кнопку "Продолжить как гость"
                const guestButton = await this.pages[i].evaluateHandle(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.find(btn => {
                        const text = btn.textContent?.trim() || '';
                        return text.includes('Продолжить как гость') || text.includes('Continue as guest');
                    });
                });
                
                if (guestButton && await guestButton.evaluate(btn => !!btn)) {
                    await guestButton.click();
                    console.log(`✅ Гостевой вход выполнен в браузере ${i + 1}`);
                    
                    // Ждем загрузки
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await this.takeScreenshot(this.pages[i], `step02_browser${i + 1}_after_guest.png`);
                } else {
                    console.log(`❌ Кнопка гостевого входа не найдена в браузере ${i + 1}`);
                }
            }
            
            // Шаг 3: Извлекаем имена пользователей
            console.log('\n📋 Шаг 3: Извлечение имен пользователей');
            for (let i = 0; i < this.pages.length; i++) {
                await this.extractUserNamesFromProfile(this.pages[i], i);
                await this.takeScreenshot(this.pages[i], `step03_browser${i + 1}_profile.png`);
            }
            
            // Шаг 4: Проверяем видимость пользователей между браузерами
            console.log('\n📋 Шаг 4: Проверка видимости пользователей');
            
            if (this.userNames[0] && this.userNames[1]) {
                console.log(`\n🔍 Проверка: Пользователь "${this.userNames[0]}" виден в браузере 2`);
                const user1VisibleInBrowser2 = await this.checkUserVisibility(this.pages[1], this.userNames[0], 1);
                
                console.log(`\n🔍 Проверка: Пользователь "${this.userNames[1]}" виден в браузере 1`);
                const user2VisibleInBrowser1 = await this.checkUserVisibility(this.pages[0], this.userNames[1], 0);
                
                // Результаты
                console.log('\n📊 Результаты теста:');
                console.log(`✅ Пользователь 1 (${this.userNames[0]}) виден в браузере 2: ${user1VisibleInBrowser2 ? 'ДА' : 'НЕТ'}`);
                console.log(`✅ Пользователь 2 (${this.userNames[1]}) виден в браузере 1: ${user2VisibleInBrowser1 ? 'ДА' : 'НЕТ'}`);
                
                const success = user1VisibleInBrowser2 && user2VisibleInBrowser1;
                console.log(`\n🎯 Итоговый результат: ${success ? 'ТЕСТ ПРОЙДЕН' : 'ТЕСТ ПРОВАЛЕН'}`);
                
                return success;
            } else {
                console.log('❌ Не удалось получить имена пользователей');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Ошибка в тесте:', error);
            return false;
        }
    }

    async cleanup() {
        console.log('\n🧹 Очистка ресурсов...');
        for (const browser of this.browsers) {
            await browser.close();
        }
        console.log('✅ Очистка завершена');
    }
}

async function main() {
    const analyzer = new IntelligentUIAnalyzer();
    
    try {
        await analyzer.initialize();
        const result = await analyzer.runTest();
        
        if (result) {
            console.log('\n🎉 Финальный интеллектуальный тест успешно завершен!');
        } else {
            console.log('\n💥 Финальный интеллектуальный тест провален!');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
    } finally {
        await analyzer.cleanup();
    }
}

if (require.main === module) {
    main();
}

module.exports = IntelligentUIAnalyzer; 