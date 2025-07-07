const { Pool } = require('pg');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD, 'type:', typeof process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function dropAllTables() {
  const tables = [
    'analytics', 'sessions', 'messages', 'reactions', 'comments', 'posts', 'notifications', 'users', 'settings'
  ];
  for (const table of tables) {
    try {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
      console.log(`Dropped table: ${table}`);
    } catch (e) {
      console.log(`Skip drop ${table}:`, e.message);
    }
  }
}

async function printTableStructure() {
  const res = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  for (const row of res.rows) {
    const table = row.table_name;
    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    console.log(`\n=== ${table} ===`);
    cols.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    });
  }
}

async function main() {
  console.log('⏳ Дропаю все таблицы...');
  await dropAllTables();
  await pool.end();

  // Ждём завершения транзакций
  await new Promise(r => setTimeout(r, 500));

  console.log('⏳ Запускаю init-db.js...');
  execSync('node init-db.js', { stdio: 'inherit', cwd: __dirname });

  // Новый pool для вывода структуры
  const pool2 = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  console.log('\n📋 Структура всех таблиц после инициализации:');
  await (async function printTableStructure(pool) {
    const res = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    for (const row of res.rows) {
      const table = row.table_name;
      const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      console.log(`\n=== ${table} ===`);
      cols.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });
    }
  })(pool2);
  await pool2.end();
}

main().catch(e => {
  console.error('Ошибка:', e);
  process.exit(1);
}); 