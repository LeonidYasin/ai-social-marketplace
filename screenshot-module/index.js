const SimpleScreenshotGenerator = require('./simple_screenshot_generator');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const LOG_PATH = path.resolve(__dirname, '../run_log.txt');

function startLogTailWindow() {
    // Открываем отдельное окно cmd для просмотра лога
    // Сначала выводим накопленный лог (type), затем в реальном времени через powershell Get-Content -Wait
    const cmd = `start cmd /k "type \"${LOG_PATH}\" & powershell -Command \"Get-Content -Wait -Encoding UTF8 '${LOG_PATH.replace(/\\/g, '/').replace(/'/g, "''")}'\""`;
    exec(cmd);
}

async function main() {
    // Удаляем старый лог-файл, если есть
    if (fs.existsSync(LOG_PATH)) {
        try { fs.unlinkSync(LOG_PATH); } catch (e) {}
    }
    // Запускаем отдельное окно для лога
    startLogTailWindow();
    // Принудительно очищаем буфер консоли
    if (process.stdout.write) {
        process.stdout.write('');
    }
    
    console.log('🚀 Запуск полного процесса создания скриншотов...');
    console.log('📋 План выполнения:');
    console.log('1. Инициализация генератора');
    console.log('2. Проверка Tesseract OCR');
    console.log('3. Загрузка OCR координат');
    console.log('4. Создание всех скриншотов с DOM и OCR анализом');
    console.log('5. Валидация каждого состояния');
    console.log('6. Генерация отчёта');
    console.log('');
    
    // Принудительно очищаем буфер
    if (process.stdout.write) {
        process.stdout.write('');
    }

    // Переопределяем глобальный логгер для записи в файл
    const origLog = console.log;
    const origErr = console.error;
    function logToFile(...args) {
        const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        fs.appendFileSync(LOG_PATH, msg + '\n', 'utf8');
        origLog.apply(console, args);
    }
    function errToFile(...args) {
        const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        fs.appendFileSync(LOG_PATH, msg + '\n', 'utf8');
        origErr.apply(console, args);
    }
    console.log = logToFile;
    console.error = errToFile;

    const generator = new SimpleScreenshotGenerator(LOG_PATH);
    
    try {
        console.log('🔄 Начинаем инициализацию...');
        // Инициализация
        await generator.init();
        
        console.log('🔄 Начинаем создание скриншотов...');
        // Создание всех скриншотов
        await generator.generateAllScreenshots();
        
        // Финальная статистика
        console.log('');
        console.log('🎉 ПРОЦЕСС ЗАВЕРШЁН УСПЕШНО!');
        console.log(`📸 Создано скриншотов: ${generator.screenshots.length}`);
        console.log(`❌ Ошибок: ${generator.errors.length}`);
        console.log(`⏱️ Время выполнения: ${Date.now() - generator.startTime}ms`);
        
        // Обработка ошибок с Windows уведомлениями
        console.log('🔄 Обрабатываем ошибки...');
        generator.handleFinalErrors();
        
        console.log('');
        console.log('📁 Скриншоты сохранены в папке: documentation_screenshots/');
        console.log('📊 Подробные логи сохранены в консоли выше');
        
    } catch (error) {
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error('Стек ошибки:', error.stack);
        
        // Добавляем критическую ошибку с уведомлением
        console.log('🔄 Показываем уведомление об ошибке...');
        generator.addError('Критическая ошибка при выполнении процесса', error);
        generator.handleFinalErrors();
        
        process.exit(1);
    } finally {
        if (generator.browser) {
            await generator.browser.close();
        }
    }
}

// Запуск только если файл вызван напрямую
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Неожиданная ошибка:', error.message);
        process.exit(1);
    });
}

module.exports = { main }; 