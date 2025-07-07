console.log('=== Testing Backend DB Module Import ===');
console.log('='.repeat(50));

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, 'backend', 'config.env') });

console.log('Environment variables loaded:');
console.log(`  DB_HOST: "${process.env.DB_HOST}"`);
console.log(`  DB_PASSWORD: "${process.env.DB_PASSWORD}" (type: ${typeof process.env.DB_PASSWORD})`);

// Import the db module exactly like backend does
try {
  const db = require('./backend/src/utils/db');
  console.log('✅ DB module imported successfully');
  
  // Test the query function
  console.log('Testing query function...');
  db.query('SELECT NOW() as current_time')
    .then(result => {
      console.log('✅ Query successful:', result.rows[0]);
    })
    .catch(error => {
      console.error('❌ Query failed:', error.message);
    });
    
} catch (error) {
  console.error('❌ Failed to import DB module:', error.message);
} 