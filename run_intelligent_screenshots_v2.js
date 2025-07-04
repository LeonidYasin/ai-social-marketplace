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
        const initialState = await generator.analyzeScreenState('initial');
        await generator.pause(1000, 'после анализа initial');

        console.log(`🎯 Начальное состояние: ${initialState.state.name}`);

        // Если уже в главном приложении, пропускаем вход
        if (initialState.state.name === 'main_app') {
            console.log('✅ Уже находимся в главном приложении');
        } else {
            // Всегда кликать только по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"
            const clickResult = await generator.smartClickGuestButton('только кнопка ПРОДОЛЖИТЬ КАК ГОСТЬ');
            if (!clickResult.success) {
                throw new Error('Не удалось кликнуть по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ": ' + JSON.stringify(clickResult));
            }
            if (!clickResult.stateChange) {
                console.warn('⚠️ Состояние не изменилось после клика по кнопке "ПРОДОЛЖИТЬ КАК ГОСТЬ"');
            }
            console.log(`📊 Состояние после клика: ${clickResult.afterState.state.name}`);
        }

        // Анализируем финальное состояние
        const finalState = await generator.analyzeScreenState('final');
        console.log(`📊 Финальное состояние: ${finalState.state.name}`);

        // Делаем дополнительные скриншоты для документации
        await generator.pause(2000, 'перед финальными скриншотами');
        
        // Скриншот всей страницы
        await generator.takeScreenshot('full_page');
        
        // Если есть боковые панели, делаем скриншоты
        if (finalState.domInfo.sidebarElements.length > 0) {
            generator.setPanel('sidebar');
            await generator.takeScreenshot('sidebar_panel');
        }

        await generator.close();
        console.log('✅ Скрипт завершён успешно!');
        
    } catch (error) {
        await generator.handleError(error, 'main_script_v2');
        process.exit(1);
    }
})(); 