#!/usr/bin/env node

/**
 * Упрощенный запуск сервера для диагностики проблем на Render
 * Минимальные зависимости, максимальная диагностика
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config.env') });

console.log('=== Simple Server Startup ===');
console.log('Environment variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  PORT: ${process.env.PORT || 'not set'}`);
console.log(`  HOST: ${process.env.HOST || 'not set'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '***SET***' : 'NOT SET'}`);

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: 'simple-1.0.0'
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    let dbConfig;
    if (process.env.DATABASE_URL) {
      dbConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { 
          rejectUnauthorized: false 
        } : false,
      };
    } else {
      dbConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.NODE_ENV === 'production' ? { 
          rejectUnauthorized: false 
        } : false,
      };
    }
    
    const pool = new Pool(dbConfig);
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    await pool.end();
    
    res.json({ 
      status: 'ok', 
      message: 'Database connection successful',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Database test error:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error.message,
      code: error.code
    });
  }
});

// Test file system
app.get('/api/test-fs', (req, res) => {
  try {
    const fs = require('fs');
    const logsDir = path.join(__dirname, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Test writing a file
    const testFile = path.join(logsDir, 'test.txt');
    fs.writeFileSync(testFile, `Test file created at ${new Date().toISOString()}`);
    
    // Test reading the file
    const content = fs.readFileSync(testFile, 'utf8');
    
    res.json({ 
      status: 'ok', 
      message: 'File system test successful',
      testFile,
      content
    });
  } catch (error) {
    console.error('File system test error:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'File system test failed',
      error: error.message
    });
  }
});

// Test environment
app.get('/api/test-env', (req, res) => {
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    DATABASE_URL: process.env.DATABASE_URL ? '***SET***' : 'NOT SET',
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    RENDER: process.env.RENDER,
    RENDER_SERVICE_ID: process.env.RENDER_SERVICE_ID,
    RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME,
    RENDER_ENVIRONMENT: process.env.RENDER_ENVIRONMENT,
    platform: require('os').platform(),
    arch: require('os').arch(),
    nodeVersion: process.version,
    cwd: process.cwd(),
    pid: process.pid
  };
  
  res.json({ 
    status: 'ok', 
    message: 'Environment test successful',
    environment: envInfo
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error.message);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
console.log(`Starting server on ${HOST}:${PORT}...`);

const server = app.listen(PORT, HOST, () => {
  console.log('✅ Simple server started successfully!');
  console.log(`📍 Server running at: http://${HOST}:${PORT}`);
  console.log(`📍 Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`📍 Database test: http://${HOST}:${PORT}/api/test-db`);
  console.log(`📍 File system test: http://${HOST}:${PORT}/api/test-fs`);
  console.log(`📍 Environment test: http://${HOST}:${PORT}/api/test-env`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  console.error('  Code:', error.code);
  
  if (error.code === 'EADDRINUSE') {
    console.error('  Port is already in use. Try a different port.');
  } else if (error.code === 'EACCES') {
    console.error('  Permission denied. Try running with elevated privileges.');
  }
  
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 