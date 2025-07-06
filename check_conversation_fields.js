const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function checkConversationFields() {
    console.log('🔍 Checking conversation fields...\n');

    try {
        // Register a guest user
        const browserId = `test-${Date.now()}`;
        const uniqueSuffix = Math.random().toString(36).slice(-6);
        
        const guestResponse = await axios.post(`${API_BASE}/users/register`, {
            username: `guest_${browserId.slice(0, 8)}_${uniqueSuffix}`,
            email: `guest_${browserId}_${uniqueSuffix}@example.com`,
            password: Math.random().toString(36).slice(-8),
            first_name: 'Гость',
            last_name: 'Тест',
            bio: 'Тестовый гость'
        });
        
        const guest = guestResponse.data.user;
        const token = guestResponse.data.token;
        
        console.log(`✅ Guest registered: ${guest.first_name} ${guest.last_name} (ID: ${guest.id})\n`);
        
        // Get all users to find someone to message
        const usersResponse = await axios.get(`${API_BASE}/users`);
        const otherUser = usersResponse.data.find(u => u.id !== guest.id);
        
        if (!otherUser) {
            console.log('❌ No other users found');
            return;
        }
        
        console.log(`✅ Found user to message: ${otherUser.first_name} ${otherUser.last_name} (ID: ${otherUser.id})\n`);
        
        // Send a message
        console.log('📤 Sending message...');
        await axios.post(`${API_BASE}/messages/send`, {
            receiverId: otherUser.id,
            content: 'Test message'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Message sent\n');
        
        // Get conversations
        console.log('📋 Getting conversations...');
        const conversationsResponse = await axios.get(`${API_BASE}/messages/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ Found ${conversationsResponse.data.length} conversations\n`);
        
        // Show all fields for each conversation
        conversationsResponse.data.forEach((conv, index) => {
            console.log(`📝 Conversation ${index + 1}:`);
            console.log(`  - chat_id: ${conv.chat_id}`);
            console.log(`  - chat_name: ${conv.chat_name}`);
            console.log(`  - is_group: ${conv.is_group}`);
            console.log(`  - other_user_id: ${conv.other_user_id}`);
            console.log(`  - other_username: ${conv.other_username}`);
            console.log(`  - other_first_name: ${conv.other_first_name}`);
            console.log(`  - other_last_name: ${conv.other_last_name}`);
            console.log(`  - other_avatar_url: ${conv.other_avatar_url}`);
            console.log(`  - last_message: ${conv.last_message}`);
            console.log(`  - last_message_time: ${conv.last_message_time}`);
            console.log('');
        });
        
        // Check if other_user_id is present
        const hasOtherUserId = conversationsResponse.data.every(conv => conv.other_user_id !== undefined);
        console.log(`🔍 other_user_id field present: ${hasOtherUserId ? '✅ YES' : '❌ NO'}`);
        
        if (hasOtherUserId) {
            console.log('✅ SUCCESS: Frontend will be able to display conversations correctly!');
        } else {
            console.log('❌ PROBLEM: Frontend may not work correctly!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

checkConversationFields(); 