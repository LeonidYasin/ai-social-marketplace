require('dotenv').config({ path: require('path').join(__dirname, 'backend', 'config.env') });

console.log('=== Проверка подключения к marketplace_db ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

// Тестируем подключение к базе данных
const { Pool } = require('pg');

// Импортируем универсальный модуль кодировок
const encoding = require('./backend/src/utils/encoding');

// Конфигурация подключения к базе данных
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'marketplace_db',
  user: process.env.DB_USER || 'marketplace_user',
  password: process.env.DB_PASSWORD,
  // SSL настройки для production
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
};

// Добавляем универсальную настройку кодировки
const finalConfig = encoding.addEncodingToConfig(dbConfig);

// Логируем информацию о кодировках
encoding.logEncodingInfo();

console.log('=== Database Connection Test ===');
console.log('='.repeat(50));
console.log('Config:', {
  host: finalConfig.host,
  port: finalConfig.port,
  database: finalConfig.database,
  user: finalConfig.user,
  password: typeof finalConfig.password + ' (' + finalConfig.password.length + ' chars)',
  client_encoding: finalConfig.client_encoding
});

// Создаем пул соединений
const pool = new Pool(finalConfig);

async function testConnection() {
  try {
    console.log('\n1. Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    console.log('\n2. Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query executed successfully');
    console.log('Current time:', result.rows[0].current_time);
    
    console.log('\n3. Testing users table...');
    const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log('✅ Users table query successful');
    console.log('Total users:', usersResult.rows[0].user_count);
    
    console.log('\n4. Testing user creation...');
    const testUser = {
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password_hash: 'test_hash',
      first_name: 'Test',
      last_name: 'User'
    };
    
    const insertResult = await client.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [testUser.username, testUser.email, testUser.password_hash, testUser.first_name, testUser.last_name]
    );
    console.log('✅ User creation successful');
    console.log('Created user ID:', insertResult.rows[0].id);
    
    // Удаляем тестового пользователя
    await client.query('DELETE FROM users WHERE id = $1', [insertResult.rows[0].id]);
    console.log('✅ Test user cleaned up');
    
    client.release();
    console.log('\n=== All database tests passed! ===');
    
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    console.error('Hint:', error.hint);
    console.error('Position:', error.position);
    console.error('Internal position:', error.internalPosition);
    console.error('Where:', error.where);
    console.error('Schema:', error.schema);
    console.error('Table:', error.table);
    console.error('Column:', error.column);
    console.error('Data type:', error.dataType);
    console.error('Constraint:', error.constraint);
    console.error('File:', error.file);
    console.error('Line:', error.line);
    console.error('Routine:', error.routine);
    
    if (error.message.includes('SASL')) {
      console.error('\n🔍 SASL Error detected! This is likely a password encoding issue.');
      console.error('Possible solutions:');
      console.error('1. Check if password contains special characters');
      console.error('2. Verify password is properly set in environment variables');
      console.error('3. Check encoding configuration in backend/src/utils/encoding.js');
    }
  } finally {
    await pool.end();
  }
}

// Запускаем тест
testConnection(); 