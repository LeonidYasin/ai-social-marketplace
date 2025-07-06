const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Создаем подключение к базе данных
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  try {
    console.log('🔧 Инициализация базы данных...');
    
    // Читаем SQL файл с схемой базы данных
    const sqlPath = path.join(__dirname, '..', 'setup_database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Выполняем SQL команды
    await pool.query(sqlContent);
    
    console.log('✅ База данных успешно инициализирована!');
    
    // Добавляем тестовые данные, если это development окружение
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Добавление тестовых данных...');
      const testDataPath = path.join(__dirname, '..', 'add_test_data.sql');
      if (fs.existsSync(testDataPath)) {
        const testDataContent = fs.readFileSync(testDataPath, 'utf8');
        await pool.query(testDataContent);
        console.log('✅ Тестовые данные добавлены!');
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем инициализацию, если скрипт вызван напрямую
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('🎉 Инициализация завершена успешно!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase }; 