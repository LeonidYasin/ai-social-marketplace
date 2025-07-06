const { testConnection } = require('./src/utils/db');

async function healthCheck() {
  try {
    console.log('🔍 Проверка здоровья сервиса...');
    
    // Проверяем подключение к базе данных
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Ошибка подключения к базе данных');
      process.exit(1);
    }
    
    console.log('✅ Все системы работают нормально');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка проверки здоровья:', error.message);
    process.exit(1);
  }
}

// Запускаем проверку, если скрипт вызван напрямую
if (require.main === module) {
  healthCheck();
}

module.exports = { healthCheck }; 