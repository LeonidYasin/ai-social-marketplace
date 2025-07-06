const { query } = require('./backend/src/utils/db');

async function addTestData() {
  try {
    console.log('Добавление тестовых данных...');

    // Добавление тестовых пользователей
    console.log('Добавление пользователей...');
    await query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, avatar_url, bio) VALUES
      ('testuser1', 'test1@example.com', '$2b$10$test', 'Иван', 'Иванов', 'https://via.placeholder.com/150', 'Тестовый пользователь 1'),
      ('testuser2', 'test2@example.com', '$2b$10$test', 'Мария', 'Петрова', 'https://via.placeholder.com/150', 'Тестовый пользователь 2'),
      ('testuser3', 'test3@example.com', '$2b$10$test', 'Алексей', 'Сидоров', 'https://via.placeholder.com/150', 'Тестовый пользователь 3'),
      ('admin', 'admin@example.com', '$2b$10$test', 'Админ', 'Админов', 'https://via.placeholder.com/150', 'Администратор системы')
      ON CONFLICT (username) DO NOTHING
    `);

    // Используем реальные id пользователей
    const user1 = 106;
    const user2 = 107;
    const user3 = 108;

    // Добавление тестовых постов
    console.log('Добавление постов...');
    await query(`
      INSERT INTO posts (user_id, content, media_urls, media_type, background_color, privacy, section, created_at) VALUES
      (${user1}, 'Продаю iPhone 13 в отличном состоянии! Цена договорная.', ARRAY['https://via.placeholder.com/400x300'], 'image', '#f0f2f5', 'public', 'sell', NOW() - INTERVAL '2 hours'),
      (${user2}, 'Куплю MacBook Air, желательно 2022 года выпуска.', ARRAY[]::text[], NULL, '', 'public', 'buy', NOW() - INTERVAL '1 hour'),
      (${user3}, 'Отдам бесплатно книги по программированию. Забирайте в центре города.', ARRAY['https://via.placeholder.com/400x300'], 'image', '#fffde4', 'public', 'give', NOW() - INTERVAL '30 minutes'),
      (${user1}, 'Ищу соседа для съема квартиры в центре. 2+1, 25000 в месяц.', ARRAY[]::text[], NULL, '', 'public', 'realty', NOW() - INTERVAL '15 minutes'),
      (${user2}, 'Продаю велосипед, почти новый. Цена 15000 рублей.', ARRAY['https://via.placeholder.com/400x300', 'https://via.placeholder.com/400x300'], 'image', '#fbc2eb', 'public', 'sell', NOW() - INTERVAL '10 minutes'),
      (${user3}, 'Куплю игровую приставку PlayStation 5. Готов заплатить хорошую цену.', ARRAY[]::text[], NULL, '', 'public', 'buy', NOW() - INTERVAL '5 minutes'),
      (${user1}, 'Отдам котенка в хорошие руки. Возраст 3 месяца, приучен к лотку.', ARRAY['https://via.placeholder.com/400x300'], 'image', '#f9d423', 'public', 'give', NOW() - INTERVAL '2 minutes'),
      (${user2}, 'Ищу работу в IT сфере. Опыт 3 года, знаю React, Node.js, PostgreSQL.', ARRAY[]::text[], NULL, '', 'public', 'tribune', NOW() - INTERVAL '1 minute')
    `);

    // Добавление тестовых комментариев
    console.log('Добавление комментариев...');
    await query(`
      INSERT INTO comments (post_id, user_id, content, created_at) VALUES
      (1, ${user2}, 'Сколько стоит?', NOW() - INTERVAL '1 hour 30 minutes'),
      (1, ${user3}, 'Могу посмотреть?', NOW() - INTERVAL '1 hour 15 minutes'),
      (2, ${user1}, 'У меня есть MacBook Air 2021, подойдет?', NOW() - INTERVAL '45 minutes'),
      (3, ${user2}, 'Какие книги есть?', NOW() - INTERVAL '20 minutes'),
      (4, ${user3}, 'В каком районе квартира?', NOW() - INTERVAL '10 minutes'),
      (5, ${user1}, 'Фото есть?', NOW() - INTERVAL '5 minutes'),
      (6, ${user2}, 'Сколько готов заплатить?', NOW() - INTERVAL '3 minutes'),
      (7, ${user3}, 'Какой породы котенок?', NOW() - INTERVAL '1 minute')
    `);

    // Добавление тестовых реакций
    console.log('Добавление реакций...');
    await query(`
      INSERT INTO reactions (user_id, post_id, reaction_type, created_at) VALUES
      (${user2}, 1, 'like', NOW() - INTERVAL '1 hour 45 minutes'),
      (${user3}, 1, 'love', NOW() - INTERVAL '1 hour 30 minutes'),
      (${user1}, 2, 'like', NOW() - INTERVAL '1 hour 15 minutes'),
      (${user3}, 2, 'wow', NOW() - INTERVAL '1 hour'),
      (${user1}, 3, 'love', NOW() - INTERVAL '45 minutes'),
      (${user2}, 3, 'like', NOW() - INTERVAL '30 minutes'),
      (${user3}, 4, 'like', NOW() - INTERVAL '20 minutes'),
      (${user1}, 5, 'love', NOW() - INTERVAL '15 minutes'),
      (${user2}, 5, 'wow', NOW() - INTERVAL '10 minutes'),
      (${user3}, 6, 'like', NOW() - INTERVAL '8 minutes'),
      (${user1}, 7, 'love', NOW() - INTERVAL '5 minutes'),
      (${user2}, 7, 'like', NOW() - INTERVAL '3 minutes'),
      (${user3}, 8, 'like', NOW() - INTERVAL '2 minutes')
    `);

    // Проверка добавленных данных
    console.log('Проверка добавленных данных...');
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    const postsResult = await query('SELECT COUNT(*) as count FROM posts');
    const commentsResult = await query('SELECT COUNT(*) as count FROM comments');
    const reactionsResult = await query('SELECT COUNT(*) as count FROM reactions');

    console.log('Статистика:');
    console.log(`- Пользователей: ${usersResult.rows[0].count}`);
    console.log(`- Постов: ${postsResult.rows[0].count}`);
    console.log(`- Комментариев: ${commentsResult.rows[0].count}`);
    console.log(`- Реакций: ${reactionsResult.rows[0].count}`);

    console.log('Тестовые данные успешно добавлены!');
  } catch (error) {
    console.error('Ошибка при добавлении тестовых данных:', error);
  } finally {
    process.exit(0);
  }
}

addTestData(); 