-- Добавление колонки role в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';

-- Обновление существующих пользователей (делаем первого админом)
UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users);

-- Проверка результата
SELECT id, username, first_name, last_name, role FROM users ORDER BY id; 