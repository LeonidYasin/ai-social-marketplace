const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class DocumentationScreenshotCreator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshotsDir = 'documentation_screenshots';
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
        
        // Создаем директорию для скриншотов
        if (!fs.existsSync(this.screenshotsDir)) {
            fs.mkdirSync(this.screenshotsDir, { recursive: true });
        }
    }

    async universalWait(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            console.log(`⚠️ Элемент ${selector} не найден за ${timeout}ms`);
            return false;
        }
    }

    async universalClick(selector, description = '') {
        try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            await this.page.click(selector);
            console.log(`✅ Клик: ${description || selector}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        } catch (error) {
            console.log(`❌ Ошибка клика ${description || selector}: ${error.message}`);
            return false;
        }
    }

    async clickButtonByText(text, description = '') {
        const buttons = await this.page.$$('button, .MuiButtonBase-root');
        for (const btn of buttons) {
            const btnText = await this.page.evaluate(el => el.textContent, btn);
            if (btnText && btnText.trim() === text) {
                await btn.click();
                console.log(`✅ Клик по кнопке с текстом: "${text}" - ${description}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return true;
            }
        }
        console.log(`❌ Кнопка с текстом "${text}" не найдена (${description})`);
        return false;
    }

    async takeScreenshot(name, description = '') {
        const filename = `${name}.png`;
        const filepath = path.join(this.screenshotsDir, filename);
        await this.page.screenshot({ 
            path: filepath, 
            fullPage: true
        });
        console.log(`📸 Скриншот: ${filename} - ${description}`);
        return filepath;
    }

    async navigateToPage() {
        console.log('🌐 Переход на главную страницу...');
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    async captureMainPage() {
        console.log('\n📱 Создание скриншотов главной страницы...');
        await this.takeScreenshot('01_main_page', 'Главная страница приложения');
    }

    async captureGuestLogin() {
        console.log('\n👤 Создание скриншотов гостевого входа...');
        // Клик на "Продолжить как гость"
        await this.clickButtonByText('Продолжить как гость', 'Кнопка "Продолжить как гость"');
        await this.takeScreenshot('02_guest_login_clicked', 'После клика на "Продолжить как гость"');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('03_guest_form', 'Форма гостевого входа');
    }

    async captureLoginForm() {
        console.log('\n🔐 Создание скриншотов формы входа...');
        // Клик на "Войти в систему"
        await this.clickButtonByText('Войти в систему', 'Кнопка "Войти в систему"');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('04_login_form', 'Форма входа');
        try {
            const emailInput = await this.page.$('input[placeholder*="email"], input[placeholder*="Email"], input[placeholder*="почта"], input[type="email"]');
            const passwordInput = await this.page.$('input[placeholder*="пароль"], input[placeholder*="password"], input[type="password"]');
            if (emailInput) await emailInput.type('test@example.com');
            if (passwordInput) await passwordInput.type('password123');
            await this.takeScreenshot('05_login_form_filled', 'Форма входа заполнена');
            // Клик на кнопку "Войти" или "Login"
            await this.clickButtonByText('Войти', 'Кнопка "Войти"');
            await this.clickButtonByText('Login', 'Кнопка "Login"');
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.takeScreenshot('06_after_login', 'После входа в систему');
        } catch (error) {
            console.log('⚠️ Не удалось заполнить форму входа:', error.message);
            await this.takeScreenshot('05_login_form_error', 'Ошибка заполнения формы');
        }
    }

    async captureUserProfile() {
        console.log('\n👤 Создание скриншотов профиля пользователя...');
        
        // Ищем аватар или профиль
        const avatar = await this.page.$('.MuiAvatar-root, img[alt*="avatar"], img[alt*="profile"]');
        if (avatar) {
            await avatar.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.takeScreenshot('07_user_profile', 'Профиль пользователя');
        } else {
            await this.takeScreenshot('07_no_profile', 'Профиль не найден');
        }
    }

    async captureFeed() {
        console.log('\n📰 Создание скриншотов ленты...');
        
        // Переход на главную ленту (уже на ней)
        await this.takeScreenshot('09_feed_page', 'Страница ленты');
        
        // Скролл для показа постов
        await this.page.evaluate(() => window.scrollTo(0, 500));
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('10_feed_scrolled', 'Лента со скроллом');
    }

    async capturePostCreation() {
        console.log('\n✏️ Создание скриншотов создания поста...');
        await this.clickButtonByText('Что у вас нового?', 'Кнопка создания поста');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('11_create_post_form', 'Форма создания поста');
        try {
            const postInput = await this.page.$('input[placeholder*="нового"], textarea[placeholder*="нового"], .MuiInputBase-input');
            if (postInput) {
                await postInput.type('Это тестовый пост для документации');
                await this.takeScreenshot('12_post_form_filled', 'Форма поста заполнена');
                await this.clickButtonByText('Отправить', 'Кнопка "Отправить"');
                await new Promise(resolve => setTimeout(resolve, 3000));
                await this.takeScreenshot('13_post_created', 'Пост создан');
            }
        } catch (error) {
            console.log('⚠️ Не удалось создать пост:', error.message);
        }
    }

    async captureChat() {
        console.log('\n💬 Создание скриншотов чата...');
        await this.clickButtonByText('Чаты', 'Вкладка "Чаты"');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('14_chat_page', 'Страница чата');
        const userItem = await this.page.$('.MuiListItem-root, [role="listitem"]');
        if (userItem) {
            await userItem.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.takeScreenshot('15_chat_conversation', 'Диалог в чате');
            const messageInput = await this.page.$('input[placeholder*="чат"], input[placeholder*="сообщение"], .MuiInputBase-input');
            if (messageInput) {
                await messageInput.type('Привет! Это тестовое сообщение.');
                await this.takeScreenshot('16_message_typing', 'Ввод сообщения');
                await this.clickButtonByText('Отправить', 'Кнопка "Отправить"');
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.takeScreenshot('17_message_sent', 'Сообщение отправлено');
            }
        }
    }

    async captureSidebar() {
        console.log('\n📋 Создание скриншотов боковой панели...');
        
        // Левая панель
        await this.takeScreenshot('18_left_sidebar', 'Левая боковая панель');
        
        // Правая панель
        await this.takeScreenshot('19_right_sidebar', 'Правая боковая панель');
    }

    async captureNotifications() {
        console.log('\n🔔 Создание скриншотов уведомлений...');
        
        // Ищем кнопку уведомлений
        const notificationButton = await this.page.$('button[aria-label*="уведомление"], button[aria-label*="notification"], .MuiIconButton-root');
        if (notificationButton) {
            await notificationButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.takeScreenshot('21_notifications_panel', 'Панель уведомлений');
        } else {
            await this.takeScreenshot('21_no_notifications', 'Уведомления не найдены');
        }
    }

    async captureSearch() {
        console.log('\n🔍 Создание скриншотов поиска...');
        
        // Ищем поле поиска
        const searchInput = await this.page.$('input[placeholder*="Поиск"], input[placeholder*="Search"], input[placeholder*="чат"]');
        if (searchInput) {
            await searchInput.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.takeScreenshot('22_search_form', 'Форма поиска');
            
            // Ввод поискового запроса
            await searchInput.type('тест');
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.takeScreenshot('23_search_results', 'Результаты поиска');
        } else {
            await this.takeScreenshot('22_no_search', 'Поиск не найден');
        }
    }

    async captureMobileView() {
        console.log('\n📱 Создание скриншотов мобильной версии...');
        
        // Устанавливаем мобильное разрешение
        await this.page.setViewport({ width: 375, height: 667 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.takeScreenshot('24_mobile_main', 'Мобильная версия - главная');
        
        // Возвращаем десктопное разрешение
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async createDocumentation() {
        console.log('\n📝 Создание HTML документации...');
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Документация UI - Скриншоты</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; text-align: center; }
        .screenshot { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .screenshot img { max-width: 100%; height: auto; border: 1px solid #ccc; }
        .screenshot h3 { color: #666; margin-bottom: 10px; }
        .screenshot p { color: #888; font-size: 14px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 Документация UI - Скриншоты</h1>
        <p>Полный набор скриншотов для документации пользовательского интерфейса</p>
        
        <div class="grid">
            <div class="screenshot">
                <h3>01. Главная страница</h3>
                <img src="01_main_page.png" alt="Главная страница">
                <p>Начальная страница приложения</p>
            </div>
            
            <div class="screenshot">
                <h3>02. Гостевой вход</h3>
                <img src="02_guest_login_clicked.png" alt="Гостевой вход">
                <p>После клика на кнопку "Продолжить как гость"</p>
            </div>
            
            <div class="screenshot">
                <h3>03. Форма гостя</h3>
                <img src="03_guest_form.png" alt="Форма гостя">
                <p>Форма для гостевого входа</p>
            </div>
            
            <div class="screenshot">
                <h3>04. Форма входа</h3>
                <img src="04_login_form.png" alt="Форма входа">
                <p>Стандартная форма входа</p>
            </div>
            
            <div class="screenshot">
                <h3>05. Заполненная форма</h3>
                <img src="05_login_form_filled.png" alt="Заполненная форма">
                <p>Форма входа с введенными данными</p>
            </div>
            
            <div class="screenshot">
                <h3>06. После входа</h3>
                <img src="06_after_login.png" alt="После входа">
                <p>Интерфейс после успешного входа</p>
            </div>
            
            <div class="screenshot">
                <h3>07. Профиль пользователя</h3>
                <img src="07_user_profile.png" alt="Профиль пользователя">
                <p>Страница профиля пользователя</p>
            </div>
            
            <div class="screenshot">
                <h3>09. Лента</h3>
                <img src="09_feed_page.png" alt="Лента">
                <p>Страница ленты постов</p>
            </div>
            
            <div class="screenshot">
                <h3>10. Лента со скроллом</h3>
                <img src="10_feed_scrolled.png" alt="Лента со скроллом">
                <p>Лента после прокрутки</p>
            </div>
            
            <div class="screenshot">
                <h3>11. Создание поста</h3>
                <img src="11_create_post_form.png" alt="Создание поста">
                <p>Форма создания нового поста</p>
            </div>
            
            <div class="screenshot">
                <h3>12. Заполненный пост</h3>
                <img src="12_post_form_filled.png" alt="Заполненный пост">
                <p>Форма поста с введенным контентом</p>
            </div>
            
            <div class="screenshot">
                <h3>13. Пост создан</h3>
                <img src="13_post_created.png" alt="Пост создан">
                <p>После успешного создания поста</p>
            </div>
            
            <div class="screenshot">
                <h3>14. Чат</h3>
                <img src="14_chat_page.png" alt="Чат">
                <p>Страница чата</p>
            </div>
            
            <div class="screenshot">
                <h3>15. Диалог</h3>
                <img src="15_chat_conversation.png" alt="Диалог">
                <p>Диалог в чате</p>
            </div>
            
            <div class="screenshot">
                <h3>16. Ввод сообщения</h3>
                <img src="16_message_typing.png" alt="Ввод сообщения">
                <p>Ввод нового сообщения</p>
            </div>
            
            <div class="screenshot">
                <h3>17. Сообщение отправлено</h3>
                <img src="17_message_sent.png" alt="Сообщение отправлено">
                <p>После отправки сообщения</p>
            </div>
            
            <div class="screenshot">
                <h3>18. Левая панель</h3>
                <img src="18_left_sidebar.png" alt="Левая панель">
                <p>Левая боковая панель навигации</p>
            </div>
            
            <div class="screenshot">
                <h3>19. Правая панель</h3>
                <img src="19_right_sidebar.png" alt="Правая панель">
                <p>Правая боковая панель</p>
            </div>
            
            <div class="screenshot">
                <h3>21. Уведомления</h3>
                <img src="21_notifications_panel.png" alt="Уведомления">
                <p>Панель уведомлений</p>
            </div>
            
            <div class="screenshot">
                <h3>22. Поиск</h3>
                <img src="22_search_form.png" alt="Поиск">
                <p>Форма поиска</p>
            </div>
            
            <div class="screenshot">
                <h3>23. Результаты поиска</h3>
                <img src="23_search_results.png" alt="Результаты поиска">
                <p>Результаты поиска</p>
            </div>
            
            <div class="screenshot">
                <h3>24. Мобильная версия</h3>
                <img src="24_mobile_main.png" alt="Мобильная версия">
                <p>Главная страница в мобильной версии</p>
            </div>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(path.join(this.screenshotsDir, 'documentation.html'), htmlContent);
        console.log('✅ HTML документация создана: documentation_screenshots/documentation.html');
    }

    async run() {
        try {
            await this.init();
            await this.navigateToPage();
            
            // Создаем все скриншоты
            await this.captureMainPage();
            await this.captureGuestLogin();
            await this.captureLoginForm();
            await this.captureUserProfile();
            await this.captureFeed();
            await this.capturePostCreation();
            await this.captureChat();
            await this.captureSidebar();
            await this.captureNotifications();
            await this.captureSearch();
            await this.captureMobileView();
            
            // Создаем HTML документацию
            await this.createDocumentation();
            
            console.log('\n🎉 Все скриншоты созданы успешно!');
            console.log(`📁 Папка: ${this.screenshotsDir}`);
            console.log('📄 Документация: documentation_screenshots/documentation.html');
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Запуск скрипта
const creator = new DocumentationScreenshotCreator();
creator.run(); 