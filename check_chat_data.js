const { query } = require('./backend/src/utils/db');

async function checkChatData() {
    try {
        console.log('🔍 Checking chat data after test...\n');
        
        // Check all chats
        const chatsResult = await query('SELECT * FROM chats ORDER BY created_at DESC');
        console.log(`📋 Total chats: ${chatsResult.rows.length}`);
        chatsResult.rows.forEach((chat, index) => {
            console.log(`  Chat ${index + 1}: ID=${chat.id}, Name="${chat.name}", Group=${chat.is_group}, Created=${chat.created_at}`);
        });
        
        // Check all chat participants
        const participantsResult = await query(`
            SELECT cp.*, u.username, u.first_name, u.last_name
            FROM chat_participants cp
            JOIN users u ON cp.user_id = u.id
            ORDER BY cp.chat_id, cp.joined_at
        `);
        console.log(`\n👥 Total participants: ${participantsResult.rows.length}`);
        participantsResult.rows.forEach((participant, index) => {
            console.log(`  Participant ${index + 1}: Chat=${participant.chat_id}, User=${participant.user_id} (${participant.first_name} ${participant.last_name}), Role=${participant.role}`);
        });
        
        // Check all messages with chat info
        const messagesResult = await query(`
            SELECT m.*, u.username, u.first_name, u.last_name, c.name as chat_name
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            JOIN chats c ON m.chat_id = c.id
            ORDER BY m.created_at DESC
        `);
        console.log(`\n💬 Total messages: ${messagesResult.rows.length}`);
        messagesResult.rows.forEach((message, index) => {
            console.log(`  Message ${index + 1}: Chat=${message.chat_id} (${message.chat_name}), Sender=${message.sender_id} (${message.first_name} ${message.last_name}), Content="${message.content}"`);
        });
        
        // Group messages by chat
        console.log('\n📊 Messages grouped by chat:');
        const chatGroups = {};
        messagesResult.rows.forEach(message => {
            if (!chatGroups[message.chat_id]) {
                chatGroups[message.chat_id] = [];
            }
            chatGroups[message.chat_id].push(message);
        });
        
        Object.keys(chatGroups).forEach(chatId => {
            console.log(`  Chat ${chatId}: ${chatGroups[chatId].length} messages`);
            chatGroups[chatId].forEach(msg => {
                console.log(`    - [${msg.first_name} ${msg.last_name}]: ${msg.content}`);
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkChatData(); 