#!/usr/bin/env python3
"""
Скрипт для настройки базы данных PostgreSQL для Facebook-подобной платформы
"""

import psycopg2
import os
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Параметры подключения
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'user': 'marketplace_user',
    'password': '1',
    'database': 'marketplace_db'
}

def create_tables(cursor):
    """Создание всех таблиц для платформы"""
    
    # Таблица пользователей
    cursor.execute("""
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
            UNIQUE(oauth_provider, oauth_id)
        );
    """)
    
    # Таблица постов
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            content TEXT,
            media_urls TEXT[], -- массив URL медиафайлов
            media_type VARCHAR(20), -- image, video, document
            background_color VARCHAR(7), -- hex цвет фона
            privacy VARCHAR(20) DEFAULT 'public', -- public, friends, private
            section VARCHAR(50), -- для категоризации постов
            location VARCHAR(200),
            is_ai_generated BOOLEAN DEFAULT FALSE,
            ai_prompt TEXT, -- промпт для AI генерации
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP
        );
    """)
    
    # Таблица комментариев
    cursor.execute("""
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
    """)
    
    # Таблица реакций (лайки, эмодзи)
    cursor.execute("""
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
    """)
    
    # Таблица подписок/друзей
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS friendships (
            id SERIAL PRIMARY KEY,
            follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id)
        );
    """)
    
    # Таблица уведомлений
    cursor.execute("""
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
    """)
    
    # Таблица чатов
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chats (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100), -- для групповых чатов
            is_group BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Таблица участников чатов
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_participants (
            id SERIAL PRIMARY KEY,
            chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) DEFAULT 'member', -- member, admin
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(chat_id, user_id)
        );
    """)
    
    # Таблица сообщений
    cursor.execute("""
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
    """)
    
    # Таблица настроек пользователей
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            setting_key VARCHAR(50) NOT NULL,
            setting_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, setting_key)
        );
    """)
    
    # Таблица аналитики
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
            event_type VARCHAR(50) NOT NULL, -- view, like, share, comment
            metadata JSONB, -- дополнительные данные
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Таблица геймификации
    cursor.execute("""
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
    """)

def create_indexes(cursor):
    """Создание индексов для оптимизации запросов"""
    
    # Индексы для пользователей
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);")
    
    # Индексы для постов
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_privacy ON posts(privacy);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_section ON posts(section);")
    
    # Индексы для комментариев
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);")
    
    # Индексы для реакций
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reactions_comment_id ON reactions(comment_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);")
    
    # Индексы для дружбы
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_friendships_follower ON friendships(follower_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_friendships_following ON friendships(following_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);")
    
    # Индексы для уведомлений
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);")
    
    # Индексы для сообщений
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);")
    
    # Индексы для аналитики
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);")

def insert_sample_data(cursor):
    """Вставка тестовых данных"""
    
    # Создание тестовых пользователей
    cursor.execute("""
        INSERT INTO users (username, email, first_name, last_name, bio, avatar_url) 
        VALUES 
            ('john_doe', 'john@example.com', 'John', 'Doe', 'Software developer', 'https://via.placeholder.com/150'),
            ('jane_smith', 'jane@example.com', 'Jane', 'Smith', 'Designer', 'https://via.placeholder.com/150'),
            ('bob_wilson', 'bob@example.com', 'Bob', 'Wilson', 'Product manager', 'https://via.placeholder.com/150')
        ON CONFLICT (username) DO NOTHING;
    """)
    
    # Получение ID пользователей
    cursor.execute("SELECT id FROM users WHERE username IN ('john_doe', 'jane_smith', 'bob_wilson');")
    user_ids = [row[0] for row in cursor.fetchall()]
    
    if len(user_ids) >= 2:
        # Создание тестовых постов
        cursor.execute("""
            INSERT INTO posts (user_id, content, privacy, section) 
            VALUES 
                (%s, 'Привет всем! Это мой первый пост на новой платформе! 🎉', 'public', 'general'),
                (%s, 'Работаю над новым дизайном. Что думаете?', 'public', 'work'),
                (%s, 'Отличная погода сегодня для прогулки! ☀️', 'public', 'lifestyle')
            ON CONFLICT DO NOTHING;
        """, (user_ids[0], user_ids[1], user_ids[0] if len(user_ids) > 0 else user_ids[0]))
        
        # Создание дружбы между пользователями
        cursor.execute("""
            INSERT INTO friendships (follower_id, following_id, status) 
            VALUES (%s, %s, 'accepted'), (%s, %s, 'accepted')
            ON CONFLICT DO NOTHING;
        """, (user_ids[0], user_ids[1], user_ids[1], user_ids[0]))

def main():
    """Основная функция настройки базы данных"""
    
    try:
        # Подключение к базе данных
        print("Подключение к PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Подключение успешно!")
        
        # Создание таблиц
        print("Создание таблиц...")
        create_tables(cursor)
        print("✅ Таблицы созданы!")
        
        # Создание индексов
        print("Создание индексов...")
        create_indexes(cursor)
        print("✅ Индексы созданы!")
        
        # Вставка тестовых данных
        print("Добавление тестовых данных...")
        insert_sample_data(cursor)
        print("✅ Тестовые данные добавлены!")
        
        # Проверка созданных таблиц
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print("\n📋 Созданные таблицы:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Проверка тестовых данных
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM posts;")
        post_count = cursor.fetchone()[0]
        
        print(f"\n📊 Статистика:")
        print(f"  - Пользователей: {user_count}")
        print(f"  - Постов: {post_count}")
        
        print("\n🎉 База данных успешно настроена!")
        print("\nСтрока подключения для backend:")
        print("DATABASE_URL=postgresql://marketplace_user:1@localhost:5432/marketplace_db")
        
    except psycopg2.Error as e:
        print(f"❌ Ошибка PostgreSQL: {e}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()
            print("\n🔌 Соединение закрыто.")

if __name__ == "__main__":
    main() 