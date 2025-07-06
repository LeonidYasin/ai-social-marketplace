const { query } = require('./backend/src/utils/db');

async function checkTables() {
    try {
        console.log('🔍 Checking all database tables...\n');
        
        // Get all tables
        const tablesResult = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('All tables:', tablesResult.rows.map(r => r.table_name));
        
        // Check if there are any chat-related tables
        const chatTables = tablesResult.rows.filter(r => 
            r.table_name.includes('chat') || 
            r.table_name.includes('message') ||
            r.table_name.includes('conversation')
        );
        
        console.log('\nChat/message related tables:', chatTables.map(r => r.table_name));
        
        // Check messages table structure again
        console.log('\nMessages table structure:');
        const messagesStructure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'messages' 
            ORDER BY ordinal_position
        `);
        
        messagesStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check if there are any existing messages
        const messagesCount = await query('SELECT COUNT(*) FROM messages');
        console.log(`\nTotal messages: ${messagesCount.rows[0].count}`);
        
        if (messagesCount.rows[0].count > 0) {
            const sampleMessage = await query('SELECT * FROM messages LIMIT 1');
            console.log('Sample message:', sampleMessage.rows[0]);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkTables(); 