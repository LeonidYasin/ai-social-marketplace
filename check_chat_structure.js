const { query } = require('./backend/src/utils/db');

async function checkChatStructure() {
    try {
        console.log('🔍 Checking chat-related tables structure...\n');
        
        // Check chats table
        console.log('1. Chats table structure:');
        const chatsStructure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'chats' 
            ORDER BY ordinal_position
        `);
        chatsStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check chat_participants table
        console.log('\n2. Chat_participants table structure:');
        const participantsStructure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'chat_participants' 
            ORDER BY ordinal_position
        `);
        participantsStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check messages table structure
        console.log('\n3. Messages table structure:');
        const messagesStructure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'messages' 
            ORDER BY ordinal_position
        `);
        messagesStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check existing data
        console.log('\n4. Existing data:');
        const chatsCount = await query('SELECT COUNT(*) FROM chats');
        const participantsCount = await query('SELECT COUNT(*) FROM chat_participants');
        const messagesCount = await query('SELECT COUNT(*) FROM messages');
        
        console.log(`  - Chats: ${chatsCount.rows[0].count}`);
        console.log(`  - Chat participants: ${participantsCount.rows[0].count}`);
        console.log(`  - Messages: ${messagesCount.rows[0].count}`);
        
        if (chatsCount.rows[0].count > 0) {
            const sampleChat = await query('SELECT * FROM chats LIMIT 1');
            console.log('  - Sample chat:', sampleChat.rows[0]);
        }
        
        if (participantsCount.rows[0].count > 0) {
            const sampleParticipant = await query('SELECT * FROM chat_participants LIMIT 1');
            console.log('  - Sample participant:', sampleParticipant.rows[0]);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkChatStructure(); 