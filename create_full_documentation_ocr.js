const IntelligentScreenshotGenerator = require('./intelligent_screenshot_generator');

/**
 * Полный генератор документации с OCR-кликами
 * Создает все необходимые скриншоты для документации
 */
class FullDocumentationGenerator {
    constructor() {
        this.generator = new IntelligentScreenshotGenerator();
    }

    /**
     * Универсальный OCR клик по тексту
     */
    async ocrClick(text, description = '') {
        console.log(`🎯 OCR клик: "${text}" ${description}`);
        
        const screenshotPath = await this.generator.takeScreenshot(`search_${text.replace(/\s+/g, '_')}`);
        const ocrText = await this.generator.extractTextFromImage(screenshotPath);
        
        // Ищем элемент с нужным текстом
        const coords = ocrText.filter(item => {
            const itemText = item.text?.toLowerCase() || '';
            return itemText.includes(text.toLowerCase());
        });
        
        if (coords.length > 0) {
            const target = coords[0];
            console.log(`✅ Найдено "${target.text}" (уверенность: ${target.confidence}%)`);
            console.log(`📍 Координаты: (${target.centerX}, ${target.centerY})`);
            
            await this.generator.page.mouse.click(target.centerX, target.centerY);
            console.log(`🖱️ OCR клик выполнен по "${target.text}"`);
            
            await this.generator.pause(1000, 'после OCR клика');
            return { success: true, target: target };
        } else {
            console.log(`❌ OCR не нашел "${text}"`);
            return { success: false, reason: 'text_not_found' };
        }
    }

    /**
     * Сценарий: Гостевой вход
     */
    async guestLoginScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Гостевой вход ===');
        
        this.generator.setScenario('guest_login');
        
        // 1. Главная страница
        this.generator.setPanel('main_page');
        await this.generator.takeScreenshot('01_main_page');
        
        // 2. Клик по "Гость"
        const guestClick = await this.ocrClick('гость', 'гостевой вход');
        if (!guestClick.success) {
            console.log('⚠️ Не удалось найти кнопку "Гость", пробуем "продолжить"');
            await this.ocrClick('продолжить', 'альтернативный поиск');
        }
        
        // 3. После входа
        this.generator.setPanel('after_login');
        await this.generator.takeScreenshot('02_after_guest_login');
        
        console.log('✅ Сценарий гостевого входа завершен');
    }

    /**
     * Сценарий: Создание поста
     */
    async createPostScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Создание поста ===');
        
        this.generator.setScenario('create_post');
        
        // 1. Главная страница после входа
        this.generator.setPanel('main_feed');
        await this.generator.takeScreenshot('01_main_feed');
        
        // 2. Клик по "Создать пост" или "Написать"
        const createClick = await this.ocrClick('создать', 'открытие формы поста');
        if (!createClick.success) {
            await this.ocrClick('написать', 'альтернативный поиск кнопки создания');
        }
        
        // 3. Форма создания поста
        this.generator.setPanel('post_form');
        await this.generator.takeScreenshot('02_create_post_form');
        
        // 4. Заполнение формы (симуляция)
        await this.generator.pause(1000, 'симуляция заполнения формы');
        await this.generator.takeScreenshot('03_post_form_filled');
        
        // 5. Отправка поста
        const sendClick = await this.ocrClick('отправить', 'отправка поста');
        if (!sendClick.success) {
            await this.ocrClick('опубликовать', 'альтернативная кнопка отправки');
        }
        
        // 6. Пост создан
        this.generator.setPanel('post_created');
        await this.generator.takeScreenshot('04_post_created');
        
        console.log('✅ Сценарий создания поста завершен');
    }

    /**
     * Сценарий: Чат
     */
    async chatScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Чат ===');
        
        this.generator.setScenario('chat');
        
        // 1. Открытие чата
        this.generator.setPanel('chat_page');
        const chatClick = await this.ocrClick('чат', 'открытие чата');
        if (!chatClick.success) {
            await this.ocrClick('сообщения', 'альтернативный поиск чата');
        }
        
        await this.generator.takeScreenshot('01_chat_page');
        
        // 2. Выбор пользователя для чата
        await this.generator.pause(1000, 'выбор пользователя');
        await this.generator.takeScreenshot('02_chat_conversation');
        
        // 3. Ввод сообщения
        await this.generator.pause(1000, 'ввод сообщения');
        await this.generator.takeScreenshot('03_message_typing');
        
        // 4. Отправка сообщения
        const sendMessageClick = await this.ocrClick('отправить', 'отправка сообщения');
        if (!sendMessageClick.success) {
            await this.ocrClick('комментарий', 'альтернативная кнопка отправки');
        }
        
        // 5. Сообщение отправлено
        await this.generator.takeScreenshot('04_message_sent');
        
        console.log('✅ Сценарий чата завершен');
    }

    /**
     * Сценарий: Профиль пользователя
     */
    async profileScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Профиль пользователя ===');
        
        this.generator.setScenario('user_profile');
        
        // 1. Открытие профиля
        this.generator.setPanel('profile_page');
        const profileClick = await this.ocrClick('профиль', 'открытие профиля');
        if (!profileClick.success) {
            await this.ocrClick('пользователь', 'альтернативный поиск профиля');
        }
        
        await this.generator.takeScreenshot('01_user_profile');
        
        // 2. Настройки профиля
        this.generator.setPanel('profile_settings');
        await this.generator.takeScreenshot('02_profile_settings');
        
        console.log('✅ Сценарий профиля завершен');
    }

    /**
     * Сценарий: Боковые панели
     */
    async sidebarScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Боковые панели ===');
        
        this.generator.setScenario('sidebars');
        
        // 1. Левая панель
        this.generator.setPanel('left_sidebar');
        await this.generator.takeScreenshot('01_left_sidebar');
        
        // 2. Правая панель
        this.generator.setPanel('right_sidebar');
        await this.generator.takeScreenshot('02_right_sidebar');
        
        console.log('✅ Сценарий боковых панелей завершен');
    }

    /**
     * Сценарий: Уведомления
     */
    async notificationsScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Уведомления ===');
        
        this.generator.setScenario('notifications');
        
        // 1. Открытие уведомлений
        this.generator.setPanel('notifications_panel');
        const notifyClick = await this.ocrClick('уведомления', 'открытие уведомлений');
        if (!notifyClick.success) {
            await this.ocrClick('bell', 'альтернативный поиск уведомлений');
        }
        
        await this.generator.takeScreenshot('01_notifications_panel');
        
        console.log('✅ Сценарий уведомлений завершен');
    }

    /**
     * Сценарий: Поиск
     */
    async searchScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Поиск ===');
        
        this.generator.setScenario('search');
        
        // 1. Открытие поиска
        this.generator.setPanel('search_form');
        const searchClick = await this.ocrClick('поиск', 'открытие поиска');
        if (!searchClick.success) {
            await this.ocrClick('найти', 'альтернативный поиск');
        }
        
        await this.generator.takeScreenshot('01_search_form');
        
        // 2. Результаты поиска
        this.generator.setPanel('search_results');
        await this.generator.pause(1000, 'симуляция поиска');
        await this.generator.takeScreenshot('02_search_results');
        
        console.log('✅ Сценарий поиска завершен');
    }

    /**
     * Сценарий: Мобильная версия
     */
    async mobileScenario() {
        console.log('\n📋 === СЦЕНАРИЙ: Мобильная версия ===');
        
        this.generator.setScenario('mobile');
        
        // Устанавливаем мобильное разрешение
        await this.generator.page.setViewport({
            width: 375,
            height: 667,
            deviceScaleFactor: 2
        });
        
        this.generator.setPanel('mobile_main');
        await this.generator.takeScreenshot('01_mobile_main');
        
        // Возвращаем десктопное разрешение
        await this.generator.page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2
        });
        
        console.log('✅ Сценарий мобильной версии завершен');
    }

    /**
     * Запуск всех сценариев
     */
    async runAllScenarios() {
        try {
            await this.generator.init();
            await this.generator.navigateTo('http://localhost:3000');
            
            console.log('🚀 Запуск полной генерации документации с OCR кликами...');
            
            // Выполняем все сценарии
            await this.guestLoginScenario();
            await this.createPostScenario();
            await this.chatScenario();
            await this.profileScenario();
            await this.sidebarScenario();
            await this.notificationsScenario();
            await this.searchScenario();
            await this.mobileScenario();
            
            console.log('\n🎉 Полная генерация документации завершена!');
            console.log('📁 Все скриншоты сохранены в структурированном виде');
            
            await this.generator.close();
            
        } catch (error) {
            await this.generator.handleError(error, 'full_documentation_generation');
            process.exit(1);
        }
    }
}

// Запуск генератора
(async () => {
    const generator = new FullDocumentationGenerator();
    await generator.runAllScenarios();
})();
