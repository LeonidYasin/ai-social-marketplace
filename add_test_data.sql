-- Скрипт для добавления тестовых данных

-- Подключение к базе данных
\c social_marketplace;

-- Добавление тестовых пользователей
INSERT INTO users (username, email, password_hash, first_name, last_name, avatar_url, bio) VALUES
('testuser1', 'test1@example.com', '$2b$10$test', 'Иван', 'Иванов', 'https://via.placeholder.com/150', 'Тестовый пользователь 1'),
('testuser2', 'test2@example.com', '$2b$10$test', 'Мария', 'Петрова', 'https://via.placeholder.com/150', 'Тестовый пользователь 2'),
('testuser3', 'test3@example.com', '$2b$10$test', 'Алексей', 'Сидоров', 'https://via.placeholder.com/150', 'Тестовый пользователь 3'),
('admin', 'admin@example.com', '$2b$10$test', 'Админ', 'Админов', 'https://via.placeholder.com/150', 'Администратор системы')
ON CONFLICT (username) DO NOTHING;

-- Добавление тестовых постов
INSERT INTO posts (user_id, content, media_urls, media_type, background_color, privacy, section, created_at) VALUES
(1, 'Продаю iPhone 13 в отличном состоянии! Цена договорная.', ARRAY['https://via.placeholder.com/400x300'], 'image', '#f0f2f5', 'public', 'sell', NOW() - INTERVAL '2 hours'),
(2, 'Куплю MacBook Air, желательно 2022 года выпуска.', ARRAY[], NULL, '', 'public', 'buy', NOW() - INTERVAL '1 hour'),
(3, 'Отдам бесплатно книги по программированию. Забирайте в центре города.', ARRAY['https://via.placeholder.com/400x300'], 'image', '#fffde4', 'public', 'give', NOW() - INTERVAL '30 minutes'),
(1, 'Ищу соседа для съема квартиры в центре. 2+1, 25000 в месяц.', ARRAY[], NULL, '', 'public', 'realty', NOW() - INTERVAL '15 minutes'),
(2, 'Продаю велосипед, почти новый. Цена 15000 рублей.', ARRAY['https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300'], 'image', 'linear-gradient(90deg, #fbc2eb 0%, #a6c1ee 100%)', 'public', 'sell', NOW() - INTERVAL '10 minutes'),
(3, 'Куплю игровую приставку PlayStation 5. Готов заплатить хорошую цену.', ARRAY[], NULL, '', 'public', 'buy', NOW() - INTERVAL '5 minutes'),
(1, 'Отдам котенка в хорошие руки. Возраст 3 месяца, приучен к лотку.', ARRAY['https://via.placeholder.com/400x300'], 'image', 'linear-gradient(90deg, #f9d423 0%, #ff4e50 100%)', 'public', 'give', NOW() - INTERVAL '2 minutes'),
(2, 'Ищу работу в IT сфере. Опыт 3 года, знаю React, Node.js, PostgreSQL.', ARRAY[], NULL, '', 'public', 'tribune', NOW() - INTERVAL '1 minute');

-- Добавление тестовых комментариев
INSERT INTO comments (post_id, user_id, content, created_at) VALUES
(1, 2, 'Сколько стоит?', NOW() - INTERVAL '1 hour 30 minutes'),
(1, 3, 'Могу посмотреть?', NOW() - INTERVAL '1 hour 15 minutes'),
(2, 1, 'У меня есть MacBook Air 2021, подойдет?', NOW() - INTERVAL '45 minutes'),
(3, 2, 'Какие книги есть?', NOW() - INTERVAL '20 minutes'),
(4, 3, 'В каком районе квартира?', NOW() - INTERVAL '10 minutes'),
(5, 1, 'Фото есть?', NOW() - INTERVAL '5 minutes'),
(6, 2, 'Сколько готов заплатить?', NOW() - INTERVAL '3 minutes'),
(7, 3, 'Какой породы котенок?', NOW() - INTERVAL '1 minute');

-- Добавление тестовых реакций
INSERT INTO reactions (user_id, post_id, reaction_type, created_at) VALUES
(2, 1, 'like', NOW() - INTERVAL '1 hour 45 minutes'),
(3, 1, 'love', NOW() - INTERVAL '1 hour 30 minutes'),
(1, 2, 'like', NOW() - INTERVAL '1 hour 15 minutes'),
(3, 2, 'wow', NOW() - INTERVAL '1 hour'),
(1, 3, 'love', NOW() - INTERVAL '45 minutes'),
(2, 3, 'like', NOW() - INTERVAL '30 minutes'),
(3, 4, 'like', NOW() - INTERVAL '20 minutes'),
(1, 5, 'love', NOW() - INTERVAL '15 minutes'),
(2, 5, 'wow', NOW() - INTERVAL '10 minutes'),
(3, 6, 'like', NOW() - INTERVAL '8 minutes'),
(1, 7, 'love', NOW() - INTERVAL '5 minutes'),
(2, 7, 'like', NOW() - INTERVAL '3 minutes'),
(3, 8, 'like', NOW() - INTERVAL '2 minutes');

-- Добавление тестовых дружеских связей
INSERT INTO friendships (follower_id, following_id, status, created_at) VALUES
(1, 2, 'accepted', NOW() - INTERVAL '1 day'),
(2, 1, 'accepted', NOW() - INTERVAL '1 day'),
(1, 3, 'accepted', NOW() - INTERVAL '12 hours'),
(3, 1, 'accepted', NOW() - INTERVAL '12 hours'),
(2, 3, 'pending', NOW() - INTERVAL '6 hours');

-- Добавление тестовых уведомлений
INSERT INTO notifications (user_id, from_user_id, post_id, comment_id, notification_type, content, created_at) VALUES
(1, 2, 1, 1, 'comment', 'Мария прокомментировала ваш пост', NOW() - INTERVAL '1 hour 30 minutes'),
(1, 3, 1, 2, 'comment', 'Алексей прокомментировал ваш пост', NOW() - INTERVAL '1 hour 15 minutes'),
(2, 1, 2, 3, 'comment', 'Иван прокомментировал ваш пост', NOW() - INTERVAL '45 minutes'),
(3, 2, 3, 4, 'comment', 'Мария прокомментировала ваш пост', NOW() - INTERVAL '20 minutes'),
(1, 2, 1, NULL, 'like', 'Мария поставила лайк вашему посту', NOW() - INTERVAL '1 hour 45 minutes'),
(1, 3, 1, NULL, 'love', 'Алексей поставил реакцию "любовь" вашему посту', NOW() - INTERVAL '1 hour 30 minutes');

-- Добавление тестовых настроек пользователей
INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES
(1, 'notifications_enabled', 'true'),
(1, 'privacy_level', 'public'),
(2, 'notifications_enabled', 'true'),
(2, 'privacy_level', 'friends'),
(3, 'notifications_enabled', 'false'),
(3, 'privacy_level', 'private');

-- Добавление тестовой аналитики
INSERT INTO analytics (user_id, post_id, event_type, metadata, created_at) VALUES
(1, 1, 'view', '{"source": "feed"}', NOW() - INTERVAL '2 hours'),
(2, 1, 'view', '{"source": "feed"}', NOW() - INTERVAL '1 hour 45 minutes'),
(3, 1, 'view', '{"source": "feed"}', NOW() - INTERVAL '1 hour 30 minutes'),
(1, 2, 'view', '{"source": "feed"}', NOW() - INTERVAL '1 hour'),
(2, 2, 'view', '{"source": "feed"}', NOW() - INTERVAL '45 minutes'),
(3, 2, 'view', '{"source": "feed"}', NOW() - INTERVAL '30 minutes');

-- Добавление тестовой геймификации
INSERT INTO gamification (user_id, points, level, badges, achievements) VALUES
(1, 150, 2, ARRAY['first_post', 'popular_user'], '{"posts_created": 3, "likes_received": 5}'),
(2, 80, 1, ARRAY['first_post'], '{"posts_created": 2, "likes_received": 3}'),
(3, 200, 3, ARRAY['first_post', 'popular_user', 'helpful_user'], '{"posts_created": 2, "likes_received": 8, "comments_made": 5}');

-- Вывод статистики
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Posts' as table_name, COUNT(*) as count FROM posts
UNION ALL
SELECT 'Comments' as table_name, COUNT(*) as count FROM comments
UNION ALL
SELECT 'Reactions' as table_name, COUNT(*) as count FROM reactions
UNION ALL
SELECT 'Friendships' as table_name, COUNT(*) as count FROM friendships
UNION ALL
SELECT 'Notifications' as table_name, COUNT(*) as count FROM notifications; 