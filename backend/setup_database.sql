-- Скрипт настройки базы данных для Facebook-подобной платформы

-- База данных уже должна быть создана
-- Используем существующую базу данных

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(200),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    is_verified BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(100),
    google_id VARCHAR(100) UNIQUE,
    UNIQUE(oauth_provider, oauth_id)
);

-- Таблица постов
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_urls TEXT[], -- массив URL медиафайлов
    media_type VARCHAR(20), -- image, video, document
    background_color VARCHAR(255), -- hex цвет фона или CSS градиент
    privacy VARCHAR(20) DEFAULT 'public', -- public, friends, private
    section VARCHAR(50), -- для категоризации постов
    location VARCHAR(200),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt TEXT, -- промпт для AI генерации
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Таблица комментариев
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- для вложенных комментариев
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Таблица реакций (лайки, эмодзи)
CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- like, love, haha, wow, sad, angry
    emoji VARCHAR(10), -- для кастомных эмодзи
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id, reaction_type),
    UNIQUE(user_id, comment_id, reaction_type),
    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Таблица подписок/друзей
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

-- Таблица уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- like, comment, follow, mention
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100), -- для групповых чатов
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица участников чатов
CREATE TABLE IF NOT EXISTS chat_participants (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- member, admin
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, video, file
    is_ai_message BOOLEAN DEFAULT FALSE,
    reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Таблица настроек пользователей
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

-- Таблица аналитики
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- view, like, share, comment
    metadata JSONB, -- дополнительные данные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица геймификации
CREATE TABLE IF NOT EXISTS gamification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges TEXT[], -- массив полученных бейджей
    achievements JSONB, -- достижения
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов

-- Индексы для пользователей
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Индексы для постов
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON posts(privacy);
CREATE INDEX IF NOT EXISTS idx_posts_section ON posts(section);

-- Индексы для комментариев
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Индексы для реакций
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);

-- Индексы для дружбы
CREATE INDEX IF NOT EXISTS idx_friendships_follower ON friendships(follower_id);
CREATE INDEX IF NOT EXISTS idx_friendships_following ON friendships(following_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Индексы для уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Индексы для сообщений
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Индексы для аналитики
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);

-- Вставка тестовых данных

-- Создание тестовых пользователей
INSERT INTO users (username, email, first_name, last_name, bio, avatar_url) 
VALUES 
    ('john_doe', 'john@example.com', 'John', 'Doe', 'Software developer', 'https://via.placeholder.com/150'),
    ('jane_smith', 'jane@example.com', 'Jane', 'Smith', 'Designer', 'https://via.placeholder.com/150'),
    ('bob_wilson', 'bob@example.com', 'Bob', 'Wilson', 'Product manager', 'https://via.placeholder.com/150')
ON CONFLICT (username) DO NOTHING;

-- Создание тестовых постов
INSERT INTO posts (user_id, content, privacy, section) 
SELECT 
    (SELECT id FROM users WHERE username = 'john_doe'),
    'Привет всем! Это мой первый пост на новой платформе! 🎉',
    'public',
    'general'
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'john_doe')
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, content, privacy, section) 
SELECT 
    (SELECT id FROM users WHERE username = 'jane_smith'),
    'Работаю над новым дизайном. Что думаете?',
    'public',
    'work'
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'jane_smith')
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, content, privacy, section) 
SELECT 
    (SELECT id FROM users WHERE username = 'john_doe'),
    'Отличная погода сегодня для прогулки! ☀️',
    'public',
    'lifestyle'
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'john_doe')
ON CONFLICT DO NOTHING;

-- Создание дружбы между пользователями
INSERT INTO friendships (follower_id, following_id, status) 
SELECT 
    (SELECT id FROM users WHERE username = 'john_doe'),
    (SELECT id FROM users WHERE username = 'jane_smith'),
    'accepted'
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'john_doe')
  AND EXISTS (SELECT 1 FROM users WHERE username = 'jane_smith')
ON CONFLICT DO NOTHING;

INSERT INTO friendships (follower_id, following_id, status) 
SELECT 
    (SELECT id FROM users WHERE username = 'jane_smith'),
    (SELECT id FROM users WHERE username = 'john_doe'),
    'accepted'
WHERE EXISTS (SELECT 1 FROM users WHERE username = 'jane_smith')
  AND EXISTS (SELECT 1 FROM users WHERE username = 'john_doe')
ON CONFLICT DO NOTHING;

-- Вывод статистики
SELECT 'Пользователей: ' || COUNT(*) as stats FROM users
UNION ALL
SELECT 'Постов: ' || COUNT(*) as stats FROM posts
UNION ALL
SELECT 'Дружб: ' || COUNT(*) as stats FROM friendships; 