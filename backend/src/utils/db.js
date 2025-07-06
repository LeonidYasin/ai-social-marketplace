const { Pool } = require('pg');
const logger = require('./logger');

// Конфигурация подключения к базе данных
const dbConfig = {
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

// Создаем пул соединений
const pool = new Pool(dbConfig);

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
  testConnection,
  closePool
}; 