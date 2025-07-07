const { pool } = require('./backend/src/utils/db');

async function checkNotificationsTable() {
  console.log('=== ПРОВЕРКА ТАБЛИЦЫ УВЕДОМЛЕНИЙ ===');
  
  try {
    // 1. Проверяем существование таблицы
    console.log('\n1. Проверка существования таблицы notifications...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Таблица notifications существует');
    } else {
      console.log('❌ Таблица notifications НЕ существует');
      return;
    }
    
    // 2. Проверяем структуру таблицы
    console.log('\n2. Структура таблицы notifications:');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 3. Проверяем количество записей
    console.log('\n3. Количество записей в таблице:');
    const count = await pool.query('SELECT COUNT(*) FROM notifications');
    console.log(`  - Всего записей: ${count.rows[0].count}`);
    
    // 4. Проверяем последние записи
    console.log('\n4. Последние 5 записей:');
    const recent = await pool.query(`
      SELECT id, user_id, type, title, message, created_at 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (recent.rows.length > 0) {
      recent.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, User: ${row.user_id}, Type: ${row.type}, Title: ${row.title}`);
      });
    } else {
      console.log('  - Записей нет');
    }
    
    // 5. Проверяем пользователей
    console.log('\n5. Пользователи в системе:');
    const users = await pool.query(`
      SELECT id, username, first_name, last_name 
      FROM users 
      ORDER BY id 
      LIMIT 10
    `);
    
    users.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Name: ${user.first_name} ${user.last_name}`);
    });
    
    // 6. Проверяем сообщения
    console.log('\n6. Последние сообщения:');
    const messages = await pool.query(`
      SELECT id, sender_id, receiver_id, content, created_at 
      FROM messages 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (messages.rows.length > 0) {
      messages.rows.forEach(msg => {
        console.log(`  - ID: ${msg.id}, From: ${msg.sender_id}, To: ${msg.receiver_id}, Content: ${msg.content.substring(0, 50)}...`);
      });
    } else {
      console.log('  - Сообщений нет');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке таблицы:', error.message);
  } finally {
    await pool.end();
  }
}

checkNotificationsTable(); 