const { query } = require('./backend/src/utils/db');

async function checkDatabase() {
    try {
        console.log('🔍 Checking database tables...');
        
        // Check if messages table exists
        const messagesResult = await query('SELECT COUNT(*) FROM messages');
        console.log(`✅ Messages table exists, count: ${messagesResult.rows[0].count}`);
        
        // Check if users table exists
        const usersResult = await query('SELECT COUNT(*) FROM users');
        console.log(`✅ Users table exists, count: ${usersResult.rows[0].count}`);
        
        // Show some sample data
        const sampleMessages = await query('SELECT * FROM messages LIMIT 3');
        console.log(`📝 Sample messages:`, sampleMessages.rows);
        
        const sampleUsers = await query('SELECT id, username, first_name, last_name FROM users LIMIT 3');
        console.log(`👥 Sample users:`, sampleUsers.rows);
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

checkDatabase(); 