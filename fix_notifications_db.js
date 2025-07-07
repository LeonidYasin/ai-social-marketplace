const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения
require('dotenv').config({ path: path.join(__dirname, 'backend', 'config.env') });

async function fixNotificationsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Исправление структуры таблицы notifications...');
    
    // Читаем SQL скрипт
    const sqlScript = fs.readFileSync('fix_notifications_table.sql', 'utf8');
    
    // Выполняем SQL
    const result = await pool.query(sqlScript);
    
    console.log('✅ Структура таблицы notifications исправлена!');
    console.log('📋 Результат:');
    console.log(result.rows);
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении таблицы:', error);
  } finally {
    await pool.end();
  }
}

// Запускаем исправление
fixNotificationsTable(); 