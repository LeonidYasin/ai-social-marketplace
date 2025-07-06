const { query } = require('./backend/src/utils/db');

async function debugMessage() {
    try {
        console.log('🔍 Debugging message creation...\n');
        
        // 1. Check messages table structure
        console.log('1. Checking messages table structure...');
        const structureResult = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'messages' 
            ORDER BY ordinal_position
        `);
        console.log('Messages table columns:', structureResult.rows);
        
        // 2. Try to create a message directly
        console.log('\n2. Trying to create a message directly...');
        const createResult = await query(`
            INSERT INTO messages (sender_id, receiver_id, content, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *
        `, [91, 90, 'Test message from debug script']);
        
        console.log('✅ Message created successfully:', createResult.rows[0]);
        
        // 3. Check if message exists
        console.log('\n3. Checking if message exists...');
        const checkResult = await query('SELECT COUNT(*) FROM messages');
        console.log(`Total messages in database: ${checkResult.rows[0].count}`);
        
        const messageResult = await query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 1');
        console.log('Latest message:', messageResult.rows[0]);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

debugMessage(); 