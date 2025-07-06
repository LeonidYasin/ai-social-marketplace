const { query } = require('./backend/src/utils/db');

async function checkChats() {
    try {
        console.log('🔍 Checking chats and participants...\n');
        
        // Check chats
        const chatsResult = await query('SELECT COUNT(*) FROM chats');
        console.log(`✅ Chats count: ${chatsResult.rows[0].count}`);
        
        if (chatsResult.rows[0].count > 0) {
            const chats = await query('SELECT * FROM chats ORDER BY created_at DESC');
            console.log('📋 All chats:', chats.rows);
        }
        
        // Check chat participants
        const participantsResult = await query('SELECT COUNT(*) FROM chat_participants');
        console.log(`✅ Chat participants count: ${participantsResult.rows[0].count}`);
        
        if (participantsResult.rows[0].count > 0) {
            const participants = await query(`
                SELECT cp.*, u.username, u.first_name, u.last_name
                FROM chat_participants cp
                JOIN users u ON cp.user_id = u.id
                ORDER BY cp.joined_at DESC
            `);
            console.log('👥 All participants:', participants.rows);
        }
        
        // Check messages with chat info
        const messagesResult = await query(`
            SELECT m.*, u.username as sender_username, c.name as chat_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            JOIN chats c ON m.chat_id = c.id
            ORDER BY m.created_at DESC
        `);
        console.log(`✅ Messages count: ${messagesResult.rows.length}`);
        console.log('💬 All messages:', messagesResult.rows);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkChats(); 