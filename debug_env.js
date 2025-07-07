const path = require('path');

console.log('=== Environment Variables Debug ===');
console.log('='.repeat(50));

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, 'backend', 'config.env') });

console.log('Environment variables:');
console.log(`  DB_HOST: "${process.env.DB_HOST}"`);
console.log(`  DB_PORT: "${process.env.DB_PORT}"`);
console.log(`  DB_NAME: "${process.env.DB_NAME}"`);
console.log(`  DB_USER: "${process.env.DB_USER}"`);
console.log(`  DB_PASSWORD: "${process.env.DB_PASSWORD}"`);
console.log(`  DB_PASSWORD type: ${typeof process.env.DB_PASSWORD}`);
console.log(`  DB_PASSWORD length: ${process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0}`);

console.log('\nOther important variables:');
console.log(`  NODE_ENV: "${process.env.NODE_ENV}"`);
console.log(`  HOST: "${process.env.HOST}"`);
console.log(`  PORT: "${process.env.PORT}"`);

console.log('\nConfig file path:');
console.log(`  Absolute: ${path.resolve('./backend/config.env')}`);
console.log(`  Exists: ${require('fs').existsSync('./backend/config.env')}`);

// Check if config.env file exists and read its contents
try {
  const fs = require('fs');
  const configContent = fs.readFileSync('./backend/config.env', 'utf8');
  console.log('\nConfig file contents:');
  console.log('='.repeat(30));
  console.log(configContent);
  console.log('='.repeat(30));
} catch (error) {
  console.error('Error reading config.env:', error.message);
} 