const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'social_marketplace',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function updateDatabase() {
  try {
    console.log('Подключение к базе данных...');
    
    // Создание таблицы для сообщений
    console.log('Создание таблицы messages...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Создание индексов для оптимизации запросов
    console.log('Создание индексов...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);

    // Добавление полей в таблицу users
    console.log('Обновление таблицы users...');
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW();
    `);

    // Создание функции для обновления updated_at
    console.log('Создание функции update_updated_at_column...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Создание триггера
    console.log('Создание триггера...');
    await pool.query(`
      DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
      CREATE TRIGGER update_messages_updated_at 
        BEFORE UPDATE ON messages 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('База данных успешно обновлена!');
    
    // Проверяем, что таблица создана
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'messages';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Таблица messages создана успешно');
    } else {
      console.log('❌ Ошибка: таблица messages не найдена');
    }

  } catch (error) {
    console.error('Ошибка при обновлении базы данных:', error);
  } finally {
    await pool.end();
  }
}

updateDatabase(); 