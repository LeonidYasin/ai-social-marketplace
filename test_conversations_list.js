const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testConversationsList() {
    console.log('🧪 Testing Conversations List...\n');

    try {
        // 1. Register two guest users
        console.log('1. Registering two guest users...');
        
        const browserId1 = `test-${Date.now()}-1`;
        const browserId2 = `test-${Date.now()}-2`;
        const uniqueSuffix1 = Math.random().toString(36).slice(-6);
        const uniqueSuffix2 = Math.random().toString(36).slice(-6);
        
        const guest1Response = await axios.post(`${API_BASE}/users/register`, {
            username: `guest_${browserId1.slice(0, 8)}_${uniqueSuffix1}`,
            email: `guest_${browserId1}_${uniqueSuffix1}@example.com`,
            password: Math.random().toString(36).slice(-8),
            first_name: 'Гость',
            last_name: 'Первый',
            bio: 'Первый тестовый гость'
        });
        
        const guest2Response = await axios.post(`${API_BASE}/users/register`, {
            username: `guest_${browserId2.slice(0, 8)}_${uniqueSuffix2}`,
            email: `guest_${browserId2}_${uniqueSuffix2}@example.com`,
            password: Math.random().toString(36).slice(-8),
            first_name: 'Гость',
            last_name: 'Второй',
            bio: 'Второй тестовый гость'
        });
        
        const guest1 = guest1Response.data.user;
        const guest2 = guest2Response.data.user;
        const token1 = guest1Response.data.token;
        const token2 = guest2Response.data.token;
        
        console.log(`✅ Guest 1: ${guest1.first_name} ${guest1.last_name} (ID: ${guest1.id})`);
        console.log(`✅ Guest 2: ${guest2.first_name} ${guest2.last_name} (ID: ${guest2.id})\n`);
        
        // 2. Check initial conversations (should be empty)
        console.log('2. Checking initial conversations...');
        
        const initialConversations1 = await axios.get(`${API_BASE}/messages/conversations`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        
        const initialConversations2 = await axios.get(`${API_BASE}/messages/conversations`, {
            headers: { Authorization: `Bearer ${token2}` }
        });
        
        console.log(`✅ Guest 1 initial conversations: ${initialConversations1.data.length}`);
        console.log(`✅ Guest 2 initial conversations: ${initialConversations2.data.length}\n`);
        
        // 3. Send message from guest1 to guest2
        console.log('3. Sending message from Guest 1 to Guest 2...');
        const messageResponse = await axios.post(`${API_BASE}/messages/send`, {
            receiverId: guest2.id,
            content: 'Привет от первого гостя!'
        }, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        
        console.log(`✅ Message sent: ${messageResponse.data.content}\n`);
        
        // 4. Check conversations after message
        console.log('4. Checking conversations after message...');
        
        const conversations1 = await axios.get(`${API_BASE}/messages/conversations`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        
        const conversations2 = await axios.get(`${API_BASE}/messages/conversations`, {
            headers: { Authorization: `Bearer ${token2}` }
        });
        
        console.log(`✅ Guest 1 conversations: ${conversations1.data.length}`);
        console.log(`✅ Guest 2 conversations: ${conversations2.data.length}\n`);
        
        // 5. Show conversation details
        console.log('📋 Guest 1 conversations:');
        conversations1.data.forEach((conv, index) => {
            console.log(`  ${index + 1}. Chat ID: ${conv.chat_id}, Other user: ${conv.other_first_name} ${conv.other_last_name} (${conv.other_username}), Last message: "${conv.last_message}"`);
        });
        
        console.log('\n📋 Guest 2 conversations:');
        conversations2.data.forEach((conv, index) => {
            console.log(`  ${index + 1}. Chat ID: ${conv.chat_id}, Other user: ${conv.other_first_name} ${conv.other_last_name} (${conv.other_username}), Last message: "${conv.last_message}"`);
        });
        
        // 6. Check if both users see the same chat
        const chatIds1 = conversations1.data.map(c => c.chat_id);
        const chatIds2 = conversations2.data.map(c => c.chat_id);
        
        const commonChats = chatIds1.filter(id => chatIds2.includes(id));
        console.log(`\n🔍 Common chats between users: ${commonChats.length}`);
        
        if (commonChats.length > 0) {
            console.log('✅ SUCCESS: Both users see the same chat!');
            console.log(`   Common chat ID: ${commonChats[0]}`);
        } else {
            console.log('❌ PROBLEM: Users see different chats!');
        }
        
        // 7. Check if the other user is correctly identified
        const guest1SeesGuest2 = conversations1.data.some(c => 
            c.other_username === guest2.username || 
            (c.other_first_name === guest2.first_name && c.other_last_name === guest2.last_name)
        );
        
        const guest2SeesGuest1 = conversations2.data.some(c => 
            c.other_username === guest1.username || 
            (c.other_first_name === guest1.first_name && c.other_last_name === guest1.last_name)
        );
        
        console.log(`\n👥 User identification:`);
        console.log(`   Guest 1 sees Guest 2: ${guest1SeesGuest2 ? '✅ YES' : '❌ NO'}`);
        console.log(`   Guest 2 sees Guest 1: ${guest2SeesGuest1 ? '✅ YES' : '❌ NO'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

testConversationsList(); 