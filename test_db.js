const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'marketplace_user',
  host: 'localhost',
  database: 'marketplace_db',
  password: '1',
  port: 5432,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Подключение к БД успешно:', result.rows[0]);
    
    // Проверим таблицы
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\n📋 Доступные таблицы:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Проверим тестовые данные
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const postCount = await client.query('SELECT COUNT(*) FROM posts');
    
    console.log(`\n📊 Статистика:`);
    console.log(`  - Пользователей: ${userCount.rows[0].count}`);
    console.log(`  - Постов: ${postCount.rows[0].count}`);
    
    client.release();
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection(); 