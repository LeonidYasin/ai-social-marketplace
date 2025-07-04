const IntelligentScreenshotGenerator = require('./intelligent_screenshot_generator');

(async () => {
    const generator = new IntelligentScreenshotGenerator();
    try {
        await generator.init();
        await generator.navigateTo('http://localhost:3000');

        console.log('🧪 Тестирование улучшенного OCR...');

        // Сценарий: тест OCR
        generator.setScenario('ocr_test');
        generator.setPanel('ocr_verification');

        // Делаем скриншот для анализа OCR
        const screenshotPath = await generator.takeScreenshot('ocr_test_initial');
        console.log(`📸 Скриншот для OCR теста: ${screenshotPath}`);

        // Извлекаем весь текст через OCR
        console.log('🔍 Извлечение текста через улучшенный OCR...');
        const ocrText = await generator.extractTextFromImage(screenshotPath);
        
        console.log(`📊 Найдено ${ocrText.length} текстовых блоков через OCR:`);
        ocrText.forEach((item, index) => {
            console.log(`  ${index + 1}. "${item.text}" (уверенность: ${item.confidence}%, координаты: ${item.centerX}, ${item.centerY})`);
        });

        // Ищем конкретно "продолжить как гость"
        const guestButton = ocrText.filter(item => {
            const text = item.text?.toLowerCase() || '';
            return text.includes('продолжить') && text.includes('гость');
        });

        if (guestButton.length > 0) {
            console.log('✅ OCR успешно нашел кнопку "продолжить как гость":');
            guestButton.forEach((item, index) => {
                console.log(`  ${index + 1}. "${item.text}" (уверенность: ${item.confidence}%, координаты: ${item.centerX}, ${item.centerY})`);
            });

            // Тестируем клик через OCR координаты
            console.log('🖱️ Тестирование клика через OCR координаты...');
            const target = guestButton[0];
            await generator.page.mouse.click(target.centerX, target.centerY);
            console.log(`✅ Клик выполнен по координатам (${target.centerX}, ${target.centerY})`);

            // Ждем изменения состояния
            await generator.pause(2000, 'после OCR клика');
            
            // Проверяем результат
            const afterState = await generator.analyzeScreenState('after_ocr_click');
            console.log(`📊 Состояние после OCR клика: ${afterState.state.name}`);
            
        } else {
            console.log('❌ OCR не нашел кнопку "продолжить как гость"');
            
            // Показываем все найденные элементы с "продолжить" или "гость"
            const relatedElements = ocrText.filter(item => {
                const text = item.text?.toLowerCase() || '';
                return text.includes('продолжить') || text.includes('гость');
            });
            
            if (relatedElements.length > 0) {
                console.log('🔍 Найдены похожие элементы:');
                relatedElements.forEach((item, index) => {
                    console.log(`  ${index + 1}. "${item.text}" (уверенность: ${item.confidence}%)`);
                });
            }
        }

        await generator.close();
        console.log('✅ OCR тест завершен!');
        
    } catch (error) {
        await generator.handleError(error, 'ocr_test');
        process.exit(1);
    }
})(); 