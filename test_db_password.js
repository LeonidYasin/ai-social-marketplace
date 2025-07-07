const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, 'backend', 'config.env') });

console.log('=== Проверка переменных окружения ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');

// Тестируем подключение к базе данных
const { Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
};

console.log('\n=== Конфигурация подключения ===');
console.log('dbConfig:', JSON.stringify(dbConfig, null, 2));

try {
  const pool = new Pool(dbConfig);
  
  pool.on('connect', () => {
    console.log('✅ Подключение к базе данных установлено');
  });
  
  pool.on('error', (err) => {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
  });
  
  // Тестируем запрос
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('❌ Ошибка запроса:', err.message);
    } else {
      console.log('✅ Запрос выполнен успешно:', result.rows[0]);
    }
    pool.end();
  });
  
} catch (error) {
  console.error('❌ Ошибка создания пула:', error.message);
} 