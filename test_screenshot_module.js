const ScreenshotModule = require('./screenshot-module');

async function testScreenshotModule() {
    console.log('🧪 Тестирование модуля создания скриншотов...');
    
    try {
        // Создаем экземпляр модуля
        const module = new ScreenshotModule({
            headless: false, // Показываем браузер для отладки
            quality: 'high'
        });
        
        // Запускаем только сценарии состояний для теста
        const result = await module.run({
            scenario: 'states',
            ocr: false // Отключаем OCR для быстрого теста
        });
        
        console.log('\n📊 Результаты тестирования:');
        console.log(`✅ Создано скриншотов: ${result.screenshots.length}`);
        console.log(`❌ Ошибок: ${result.errors.length}`);
        console.log(`⚠️ Предупреждений: ${result.warnings.length}`);
        
        if (result.errors.length > 0) {
            console.log('\n❌ Ошибки:');
            result.errors.forEach(error => {
                console.log(`  - ${error.type}: ${error.message}`);
            });
        }
        
        console.log('\n🎉 Тестирование завершено!');
        console.log('📁 Проверьте папку documentation_screenshots/ для результатов');
        
    } catch (error) {
        console.error('💥 Ошибка тестирования:', error.message);
    }
}

// Запуск теста
testScreenshotModule(); 