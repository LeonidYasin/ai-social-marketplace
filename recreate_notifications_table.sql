-- Удаляем существующую таблицу (если есть)
DROP TABLE IF EXISTS notifications CASCADE;

-- Создание таблицы уведомлений
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL DEFAULT 'message',
    title VARCHAR(255),
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_delivered BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_user_delivered ON notifications(user_id, is_delivered);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Комментарии к таблице
COMMENT ON TABLE notifications IS 'Таблица уведомлений пользователей';
COMMENT ON COLUMN notifications.type IS 'Тип уведомления: message, system, etc.';
COMMENT ON COLUMN notifications.data IS 'Дополнительные данные в формате JSON';
COMMENT ON COLUMN notifications.is_delivered IS 'Доставлено ли уведомление до клиента';
COMMENT ON COLUMN notifications.delivered_at IS 'Время доставки уведомления';
COMMENT ON COLUMN notifications.read_at IS 'Время прочтения уведомления'; 