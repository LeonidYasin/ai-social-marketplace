const { Pool } = require('pg');
const logger = require('./logger');
const encoding = require('./encoding');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '..', 'config.env') });

console.log('[db.js] DB_HOST:', process.env.DB_HOST);
console.log('[db.js] DB_USER:', process.env.DB_USER);
console.log('[db.js] DB_PASSWORD:', process.env.DB_PASSWORD, 'type:', typeof process.env.DB_PASSWORD);
console.log('[db.js] DB_NAME:', process.env.DB_NAME);
console.log('[db.js] DATABASE_URL:', process.env.DATABASE_URL);

// Поддержка DATABASE_URL для Render.com
let dbConfig;

if (process.env.DATABASE_URL) {
  // Используем DATABASE_URL для Render
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false,
    // Настройки пула соединений
    max: 20, // максимальное количество клиентов в пуле
    idleTimeoutMillis: 30000, // время неактивности клиента
    connectionTimeoutMillis: 2000, // время ожидания соединения
  };
} else {
  // Используем отдельные переменные для локальной разработки
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // SSL настройки для production
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false,
    // Настройки пула соединений
    max: 20, // максимальное количество клиентов в пуле
    idleTimeoutMillis: 30000, // время неактивности клиента
    connectionTimeoutMillis: 2000, // время ожидания соединения
  };
}

// Добавляем универсальную настройку кодировки
dbConfig = encoding.addEncodingToConfig(dbConfig);

// Логируем информацию о кодировках при инициализации
encoding.logEncodingInfo();

// Создаем пул соединений
const pool = new Pool(dbConfig);

// Функция query для совместимости с существующим кодом
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Обработчик ошибок пула
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { 
    error: err.message, 
    stack: err.stack 
  });
  process.exit(-1);
});

// Функция для тестирования подключения
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful', { 
      timestamp: result.rows[0].now 
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { 
      error: error.message, 
      stack: error.stack 
    });
    return false;
  }
}

// Функция для закрытия пула
async function closePool() {
  try {
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool', { 
      error: error.message 
    });
  }
}

module.exports = {
  pool,
  query,
  testConnection,
  closePool
}; 