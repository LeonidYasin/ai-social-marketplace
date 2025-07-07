#!/usr/bin/env node

/**
 * Простой тест подключения к базе данных
 * Используется для диагностики проблем на Render
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config.env') });

console.log('=== Database Connection Test ===');
console.log('Environment variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '***SET***' : 'NOT SET'}`);
console.log(`  DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || 'not set'}`);

// Create database configuration
let dbConfig;

if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL configuration');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  console.log('Using individual database variables');
  dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

console.log('Database config (without password):', {
  ...dbConfig,
  password: dbConfig.password ? '***SET***' : 'NOT SET'
});

// Test connection
async function testConnection() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query test successful!');
    console.log('  Current time:', result.rows[0].current_time);
    console.log('  PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    
    // Test table existence
    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log('✅ Tables found:', tablesResult.rows.length);
      if (tablesResult.rows.length > 0) {
        console.log('  Tables:', tablesResult.rows.map(row => row.table_name).join(', '));
      }
    } catch (tableError) {
      console.log('⚠️ Could not check tables:', tableError.message);
    }
    
    client.release();
    await pool.end();
    
    console.log('✅ Database test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    console.error('  Detail:', error.detail);
    console.error('  Hint:', error.hint);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('  This usually means the database server is not running or not accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.error('  This usually means the database host cannot be resolved');
    } else if (error.code === '28P01') {
      console.error('  This usually means invalid username/password');
    } else if (error.code === '3D000') {
      console.error('  This usually means the database does not exist');
    }
    
    await pool.end();
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database connection test PASSED');
      process.exit(0);
    } else {
      console.log('\n💥 Database connection test FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error during test:', error.message);
    process.exit(1);
  }); 