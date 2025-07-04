const FinalOCRBot = require('./final_ocr_bot');

async function runFixedTests() {
    console.log('🚀 Запуск исправленных тестов финального OCR бота...');
    
    const bot = new FinalOCRBot();
    
    try {
        await bot.init();
        
        // Тест 1: Анализ состояния
        console.log('\n📱 Тест 1: Анализ состояния');
        const state = await bot.analyzeCurrentState();
        console.log(`Текущее состояние: ${state.name} (уверенность: ${state.confidence})`);
        
        // Тест 2: Поиск элементов
        console.log('\n🔍 Тест 2: Поиск элементов');
        
        const guestButton = await bot.findElementByText('Продолжить как гость');
        if (guestButton) {
            console.log(`✅ Найдена кнопка "Продолжить как гость"`);
        } else {
            console.log(`❌ Кнопка "Продолжить как гость" не найдена`);
        }
        
        const menuButton = await bot.findElementByTestId('MenuIcon');
        if (menuButton) {
            console.log(`✅ Найдена кнопка меню`);
        } else {
            console.log(`❌ Кнопка меню не найдена`);
        }
        
        // Тест 3: Создание поста
        console.log('\n✏️ Тест 3: Создание поста');
        const postCreated = await bot.createPost();
        if (postCreated) {
            console.log('✅ Пост создан успешно');
        } else {
            console.log('❌ Ошибка создания поста');
        }
        
        // Тест 4: Лайк поста
        console.log('\n👍 Тест 4: Лайк поста');
        const postLiked = await bot.likePost();
        if (postLiked) {
            console.log('✅ Лайк поставлен успешно');
        } else {
            console.log('❌ Ошибка лайка поста');
        }
        
        // Тест 5: Открытие меню
        console.log('\n📋 Тест 5: Открытие меню');
        const menuOpened = await bot.openMenu();
        if (menuOpened) {
            console.log('✅ Меню открыто успешно');
        } else {
            console.log('❌ Ошибка открытия меню');
        }
        
        // Тест 6: Отправка сообщения
        console.log('\n💬 Тест 6: Отправка сообщения');
        const messageSent = await bot.sendMessage();
        if (messageSent) {
            console.log('✅ Сообщение отправлено успешно');
        } else {
            console.log('❌ Ошибка отправки сообщения');
        }
        
        // Генерация отчета
        console.log('\n📄 Генерация отчета...');
        const report = await bot.generateReport();
        if (report) {
            console.log('✅ Отчет сгенерирован');
        }
        
        console.log('\n✅ Все тесты завершены!');
        
    } catch (error) {
        console.error(`❌ Критическая ошибка: ${error.message}`);
    } finally {
        await bot.cleanup();
    }
}

// Запуск тестов
if (require.main === module) {
    runFixedTests();
}

module.exports = { runFixedTests }; 