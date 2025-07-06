const IntelligentScreenshotGenerator = require('./intelligent_screenshot_generator');

(async () => {
    const generator = new IntelligentScreenshotGenerator();
    try {
        await generator.init();
        await generator.navigateTo('http://localhost:3000');

        // Сценарий: гостевой вход, главная панель
        generator.setScenario('guest_login');
        generator.setPanel('main_panel');

        // Анализируем начальное состояние и делаем скриншот
        await generator.analyzeScreenState('initial');
        await generator.pause(1000, 'после анализа initial');

        // Умный клик по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"
        const clickResult = await generator.smartClickGuestButton('гостевой вход');
        if (!clickResult.success) {
            throw new Error('Не удалось выполнить гостевой вход: ' + JSON.stringify(clickResult));
        }

        // После входа — анализируем состояние и делаем скриншот
        await generator.analyzeScreenState('after_guest_login');
        await generator.pause(1000, 'после анализа after_guest_login');

        // Можно добавить дополнительные шаги: открыть профиль, чат, и т.д.

        await generator.close();
        console.log('✅ Скрипт завершён успешно!');
    } catch (error) {
        await generator.handleError(error, 'main_script');
        process.exit(1);
    }
})(); 