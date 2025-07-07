const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from config.env
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

// Импортируем универсальный модуль кодировок
const encoding = require('./src/utils/encoding');

// Поддержка DATABASE_URL для Render.com
let poolConfig;

if (process.env.DATABASE_URL) {
  // Используем DATABASE_URL для Render
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false
  };
} else {
  // Используем отдельные переменные для локальной разработки
  poolConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
}

// Добавляем универсальную настройку кодировки
poolConfig = encoding.addEncodingToConfig(poolConfig);

// Логируем информацию о кодировках
encoding.logEncodingInfo();

// Создаем подключение к базе данных
const pool = new Pool(poolConfig);

async function initializeDatabase() {
  try {
    console.log('🔧 Инициализация базы данных...');
    
    // Сначала гарантируем наличие всех нужных колонок (отдельно, до индексов)
    await pool.query("ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN NOT NULL DEFAULT FALSE;");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(32) NOT NULL DEFAULT 'message';");
    await pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id INTEGER;");
    await pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';");
    await pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;");
    await pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;");
    await pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;");
    await pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
    await pool.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER;");
    await pool.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
    await pool.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE reactions ADD COLUMN IF NOT EXISTS comment_id INTEGER;");
    await pool.query("ALTER TABLE reactions ADD COLUMN IF NOT EXISTS reaction_type VARCHAR(20);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'local';");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");

    // SQL для создания всех таблиц с правильной структурой
    const initSQL = `
      -- Создание таблицы пользователей
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        auth_method VARCHAR(20) DEFAULT 'local' -- local, google, telegram, etc.
      );

      -- Создание таблицы постов
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        content TEXT NOT NULL,
        media_urls TEXT[], -- массив URL изображений/видео
        media_type VARCHAR(20), -- image, video, document
        category VARCHAR(50) DEFAULT 'general',
        price DECIMAL(10,2),
        currency VARCHAR(3) DEFAULT 'RUB',
        location VARCHAR(100),
        tags TEXT[],
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0
      );

      -- Создание таблицы комментариев
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        likes_count INTEGER DEFAULT 0
      );

      -- Создание таблицы реакций
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        reaction_type VARCHAR(20) NOT NULL, -- like, love, haha, wow, sad, angry
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id, reaction_type),
        UNIQUE(user_id, comment_id, reaction_type),
        CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
      );

      -- Создание таблицы уведомлений с правильной структурой
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(32) NOT NULL DEFAULT 'message',
        title VARCHAR(255),
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        is_delivered BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP
      );

      -- Создание таблицы сообщений
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text', -- text, image, video, file
        media_url TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );

      -- Создание таблицы сессий
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        data JSONB,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Создание таблицы аналитики
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL, -- view, like, share, comment
        event_data JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Создание таблицы настроек
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(64) PRIMARY KEY,
        value TEXT
      );

      -- Создание индексов для производительности
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_delivered ON notifications(is_delivered);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
    `;

    // Выполняем SQL
    await pool.query(initSQL);
    
    console.log('✅ База данных успешно инициализирована!');
    
    // Проверяем структуру таблицы notifications
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы notifications:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Запускаем инициализацию, если скрипт вызван напрямую
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Инициализация завершена успешно!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ошибка инициализации:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 