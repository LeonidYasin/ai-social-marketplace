const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ScreenshotDocumentation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshotsDir = 'test_screenshots/documentation';
        this.baseUrl = 'http://localhost:3000';
    }

    async init() {
        console.log('🚀 Инициализация браузера...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Создаем директории
        this.createDirectories();
        
        console.log('✅ Браузер инициализирован');
    }

    createDirectories() {
        const dirs = [
            this.screenshotsDir,
            `${this.screenshotsDir}/elements`,
            `${this.screenshotsDir}/multiuser`,
            `${this.screenshotsDir}/states`
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async pause(ms = 2000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    async takeScreenshot(filename, description = '') {
        const filepath = path.join(this.screenshotsDir, filename);
        await this.page.screenshot({ 
            path: filepath, 
            fullPage: true 
        });
        console.log(`📸 ${description} -> ${filepath}`);
        return filepath;
    }

    async waitForElement(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            console.log(`⚠️ Элемент не найден: ${selector}`);
            return false;
        }
    }

    async waitForText(text, timeout = 10000) {
        try {
            await this.page.waitForFunction(
                (searchText) => document.body.innerText.includes(searchText),
                { timeout },
                text
            );
            return true;
        } catch (error) {
            console.log(`⚠️ Текст не найден: "${text}"`);
            return false;
        }
    }

    async captureInitialState() {
        console.log('\n📱 Захват начального состояния...');
        
        await this.page.goto(this.baseUrl);
        await this.pause(3000);
        
        // Проверяем наличие ключевых элементов
        await this.waitForText('Продолжить как гость');
        await this.waitForText('Войти в систему');
        
        await this.takeScreenshot('states/01_initial_state.png', 'Начальная страница');
        
        // Детальный скриншот кнопок
        await this.takeScreenshot('elements/01_initial_buttons.png', 'Кнопки начальной страницы');
    }

    async captureGuestMode() {
        console.log('\n👤 Захват гостевого режима...');
        
        // Кликаем "Продолжить как гость"
        await this.page.click('text="Продолжить как гость"');
        await this.pause(3000);
        
        // Проверяем переход в гостевой режим
        await this.waitForText('Онлайн');
        
        await this.takeScreenshot('states/02_guest_mode.png', 'Гостевой режим');
        
        // Детальные скриншоты элементов
        await this.takeScreenshot('elements/02_guest_sidebar_left.png', 'Левая боковая панель');
        await this.takeScreenshot('elements/03_guest_sidebar_right.png', 'Правая боковая панель');
        await this.takeScreenshot('elements/04_guest_feed.png', 'Лента постов');
    }

    async captureCreatePost() {
        console.log('\n✏️ Захват создания поста...');
        
        // Кликаем на кнопку создания поста
        await this.page.click('[data-testid="AddIcon"]');
        await this.pause(2000);
        
        // Проверяем открытие формы
        await this.waitForText('Что нового?');
        
        await this.takeScreenshot('states/03_create_post.png', 'Создание поста');
        
        // Заполняем форму
        await this.page.type('textarea[placeholder="Что нового?"]', 'Тестовый пост для документации');
        await this.pause(1000);
        
        await this.takeScreenshot('elements/05_create_post_filled.png', 'Заполненная форма поста');
        
        // Отменяем создание
        await this.page.click('text="Отмена"');
        await this.pause(2000);
    }

    async captureMenuNavigation() {
        console.log('\n📋 Захват навигации по меню...');
        
        // Открываем меню
        await this.page.click('[data-testid="MenuIcon"]');
        await this.pause(2000);
        
        await this.takeScreenshot('elements/06_menu_opened.png', 'Открытое меню');
        
        // Закрываем меню
        await this.page.click('[data-testid="MenuIcon"]');
        await this.pause(1000);
    }

    async capturePostInteraction() {
        console.log('\n👍 Захват взаимодействия с постами...');
        
        // Ищем пост для взаимодействия
        const posts = await this.page.$$('.post-card, [data-testid="post-card"]');
        
        if (posts.length > 0) {
            // Кликаем "Нравится" на первом посте
            const likeButton = await posts[0].$('text="Нравится"');
            if (likeButton) {
                await likeButton.click();
                await this.pause(1000);
                await this.takeScreenshot('elements/07_post_liked.png', 'Пост с лайком');
            }
        }
    }

    async captureSearchFunctionality() {
        console.log('\n🔍 Захват функциональности поиска...');
        
        // Кликаем на поиск
        await this.page.click('[data-testid="SearchIcon"]');
        await this.pause(2000);
        
        await this.takeScreenshot('elements/08_search_activated.png', 'Активированный поиск');
        
        // Вводим текст поиска
        await this.page.type('input[placeholder*="Поиск"], input[type="search"]', 'тест');
        await this.pause(2000);
        
        await this.takeScreenshot('states/04_search_results.png', 'Результаты поиска');
    }

    async captureProfileSettings() {
        console.log('\n👤 Захват профиля и настроек...');
        
        // Кликаем на профиль
        await this.page.click('[data-testid="AccountCircleIcon"]');
        await this.pause(2000);
        
        await this.takeScreenshot('states/05_user_profile.png', 'Профиль пользователя');
        
        // Кликаем на настройки
        await this.page.click('[data-testid="SettingsIcon"]');
        await this.pause(2000);
        
        await this.takeScreenshot('elements/09_settings_panel.png', 'Панель настроек');
    }

    async captureThemeToggle() {
        console.log('\n🌙 Захват переключения темы...');
        
        // Кликаем на переключение темы
        await this.page.click('[data-testid="LightModeIcon"], [data-testid="NightlightIcon"]');
        await this.pause(2000);
        
        await this.takeScreenshot('elements/10_theme_changed.png', 'Измененная тема');
        
        // Возвращаем исходную тему
        await this.page.click('[data-testid="LightModeIcon"], [data-testid="NightlightIcon"]');
        await this.pause(1000);
    }

    async captureMultiuserScenario() {
        console.log('\n👥 Захват многопользовательского сценария...');
        
        // Создаем второй браузер для симуляции второго пользователя
        const browser2 = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 }
        });
        const page2 = await browser2.newPage();
        
        try {
            // Первый пользователь создает пост
            await this.page.click('[data-testid="AddIcon"]');
            await this.pause(1000);
            await this.page.type('textarea[placeholder="Что нового?"]', 'Пост от первого пользователя');
            await this.page.click('text="Опубликовать"');
            await this.pause(2000);
            
            await this.takeScreenshot('multiuser/01_user1_post_created.png', 'Пользователь 1 создал пост');
            
            // Второй пользователь заходит
            await page2.goto(this.baseUrl);
            await this.pause(2000);
            await page2.click('text="Продолжить как гость"');
            await this.pause(3000);
            
            await page2.screenshot({ 
                path: path.join(this.screenshotsDir, 'multiuser/02_user2_guest_mode.png'),
                fullPage: true 
            });
            console.log('📸 Пользователь 2 в гостевом режиме -> multiuser/02_user2_guest_mode.png');
            
            // Проверяем, видит ли второй пользователь пост
            await this.pause(2000);
            await page2.screenshot({ 
                path: path.join(this.screenshotsDir, 'multiuser/03_user2_sees_post.png'),
                fullPage: true 
            });
            console.log('📸 Пользователь 2 видит пост -> multiuser/03_user2_sees_post.png');
            
        } finally {
            await browser2.close();
        }
    }

    async captureAllIcons() {
        console.log('\n🎨 Захват всех иконок...');
        
        // Создаем детальный скриншот всех иконок
        await this.takeScreenshot('elements/11_all_icons.png', 'Все иконки интерфейса');
        
        // Список всех иконок для документации
        const icons = [
            'HomeIcon', 'SearchIcon', 'NotificationsIcon', 'AccountCircleIcon',
            'MenuIcon', 'SettingsIcon', 'AddIcon', 'CloseIcon',
            'LightModeIcon', 'NightlightIcon', 'TrendingUpIcon', 'BarChartIcon'
        ];
        
        console.log('📋 Список иконок для поиска:');
        icons.forEach(icon => {
            console.log(`  - [data-testid="${icon}"]`);
        });
    }

    async generateDocumentationReport() {
        console.log('\n📄 Генерация отчета документации...');
        
        const report = {
            timestamp: new Date().toISOString(),
            screenshots: {
                states: [
                    '01_initial_state.png',
                    '02_guest_mode.png',
                    '03_create_post.png',
                    '04_search_results.png',
                    '05_user_profile.png'
                ],
                elements: [
                    '01_initial_buttons.png',
                    '02_guest_sidebar_left.png',
                    '03_guest_sidebar_right.png',
                    '04_guest_feed.png',
                    '05_create_post_filled.png',
                    '06_menu_opened.png',
                    '07_post_liked.png',
                    '08_search_activated.png',
                    '09_settings_panel.png',
                    '10_theme_changed.png',
                    '11_all_icons.png'
                ],
                multiuser: [
                    '01_user1_post_created.png',
                    '02_user2_guest_mode.png',
                    '03_user2_sees_post.png'
                ]
            },
            keyElements: {
                buttons: [
                    'Продолжить как гость',
                    'Войти в систему',
                    'Нравится',
                    'Отправить',
                    'Опубликовать',
                    'Отмена',
                    'Обзор',
                    'Топ посты',
                    'Достижения'
                ],
                placeholders: [
                    'Что нового?',
                    'Поиск...'
                ],
                states: [
                    'Начальная страница',
                    'Гостевой режим',
                    'Создание поста',
                    'Поиск',
                    'Профиль'
                ]
            }
        };
        
        const reportPath = path.join(this.screenshotsDir, 'documentation_report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`✅ Отчет сохранен: ${reportPath}`);
        return report;
    }

    async run() {
        try {
            console.log('🎯 Запуск создания документации скриншотов...');
            
            await this.init();
            
            // Основные состояния
            await this.captureInitialState();
            await this.captureGuestMode();
            await this.captureCreatePost();
            await this.captureMenuNavigation();
            await this.capturePostInteraction();
            await this.captureSearchFunctionality();
            await this.captureProfileSettings();
            await this.captureThemeToggle();
            
            // Детальные элементы
            await this.captureAllIcons();
            
            // Многопользовательские сценарии
            await this.captureMultiuserScenario();
            
            // Генерация отчета
            const report = await this.generateDocumentationReport();
            
            console.log('\n🎉 Документация создана успешно!');
            console.log(`📁 Все файлы сохранены в: ${this.screenshotsDir}`);
            console.log(`📊 Создано скриншотов: ${report.screenshots.states.length + report.screenshots.elements.length + report.screenshots.multiuser.length}`);
            
        } catch (error) {
            console.error('❌ Ошибка при создании документации:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Запуск скрипта
if (require.main === module) {
    const documentation = new ScreenshotDocumentation();
    documentation.run();
}

module.exports = ScreenshotDocumentation; 