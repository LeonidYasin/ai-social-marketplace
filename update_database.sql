-- Обновление базы данных для поддержки Google OAuth

-- Подключение к базе данных
\c social_marketplace;

-- Добавление поля google_id в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE;

-- Создание индекса для быстрого поиска по google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Проверка структуры таблицы
\d users; 