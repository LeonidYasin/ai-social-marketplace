-- Добавление недостающих колонок в таблицу notifications
-- Выполнить на Render.com в базе данных

-- Добавить колонку type если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type VARCHAR(32) NOT NULL DEFAULT 'message';
        RAISE NOTICE 'Added column "type" to notifications table';
    ELSE
        RAISE NOTICE 'Column "type" already exists in notifications table';
    END IF;
END $$;

-- Добавить колонку is_delivered если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'is_delivered') THEN
        ALTER TABLE notifications ADD COLUMN is_delivered BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added column "is_delivered" to notifications table';
    ELSE
        RAISE NOTICE 'Column "is_delivered" already exists in notifications table';
    END IF;
END $$;

-- Добавить колонку delivered_at если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'delivered_at') THEN
        ALTER TABLE notifications ADD COLUMN delivered_at TIMESTAMP;
        RAISE NOTICE 'Added column "delivered_at" to notifications table';
    ELSE
        RAISE NOTICE 'Column "delivered_at" already exists in notifications table';
    END IF;
END $$;

-- Добавить колонку read_at если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP;
        RAISE NOTICE 'Added column "read_at" to notifications table';
    ELSE
        RAISE NOTICE 'Column "read_at" already exists in notifications table';
    END IF;
END $$;

-- Показать текущую структуру таблицы
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position; 