const { Pool } = require('pg');

console.log('=== Simple Database Connection Test ===');
console.log('='.repeat(50));

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, 'backend', 'config.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'marketplace_db',
  user: process.env.DB_USER || 'marketplace_user',
  password: process.env.DB_PASSWORD,
  // Remove encoding setting completely
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
};

console.log('Database config:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  Port: ${dbConfig.port}`);
console.log(`  Database: ${dbConfig.database}`);
console.log(`  User: ${dbConfig.user}`);
console.log(`  Password type: ${typeof dbConfig.password}`);
console.log(`  Password length: ${dbConfig.password.length}`);
console.log(`  Password value: "${dbConfig.password}"`);

// Create pool
const pool = new Pool(dbConfig);

// Test connection
async function testConnection() {
  try {
    console.log('\nTesting connection...');
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    
    // Test simple query
    console.log('\nTesting simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful!');
    console.log(`Current time: ${result.rows[0].current_time}`);
    
    // Test users table
    console.log('\nTesting users table...');
    const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log('✅ Users table query successful!');
    console.log(`Total users: ${usersResult.rows[0].user_count}`);
    
    client.release();
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Detail: ${error.detail}`);
    console.error(`Hint: ${error.hint}`);
    console.error(`Position: ${error.position}`);
    console.error(`File: ${error.file}`);
    console.error(`Line: ${error.line}`);
    console.error(`Routine: ${error.routine}`);
  } finally {
    await pool.end();
  }
}

testConnection(); 