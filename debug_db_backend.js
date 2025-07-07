const { Pool } = require('pg');

console.log('=== Backend Database Connection Debug ===');
console.log('='.repeat(50));

// Load environment variables exactly like backend does
require('dotenv').config({ path: require('path').join(__dirname, 'backend', 'config.env') });

// Database configuration exactly like in backend/src/utils/db.js
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // SSL настройки для production
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  // Настройки пула соединений
  max: 20, // максимальное количество клиентов в пуле
  idleTimeoutMillis: 30000, // время неактивности клиента
  connectionTimeoutMillis: 2000, // время ожидания соединения
};

console.log('Environment variables:');
console.log(`  DB_HOST: "${process.env.DB_HOST}"`);
console.log(`  DB_PORT: "${process.env.DB_PORT}"`);
console.log(`  DB_NAME: "${process.env.DB_NAME}"`);
console.log(`  DB_USER: "${process.env.DB_USER}"`);
console.log(`  DB_PASSWORD: "${process.env.DB_PASSWORD}"`);
console.log(`  DB_PASSWORD type: ${typeof process.env.DB_PASSWORD}`);
console.log(`  DB_PASSWORD length: ${process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0}`);

console.log('\nDatabase config object:');
console.log(`  host: "${dbConfig.host}"`);
console.log(`  port: "${dbConfig.port}"`);
console.log(`  database: "${dbConfig.database}"`);
console.log(`  user: "${dbConfig.user}"`);
console.log(`  password: "${dbConfig.password}"`);
console.log(`  password type: ${typeof dbConfig.password}`);
console.log(`  ssl: ${JSON.stringify(dbConfig.ssl)}`);

// Test connection
console.log('\nTesting connection...');
const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('❌ Pool error:', err.message);
});

pool.on('connect', (client) => {
  console.log('✅ Client connected to database');
});

pool.on('acquire', (client) => {
  console.log('✅ Client acquired from pool');
});

pool.on('release', (client) => {
  console.log('✅ Client released back to pool');
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to database');
    
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name, current_user as user_name');
    console.log('✅ Query result:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Pool closed successfully');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('❌ Error details:', error);
  }
}

testConnection(); 