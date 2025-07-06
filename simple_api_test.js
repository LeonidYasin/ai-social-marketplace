const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function simpleTest() {
    console.log('🧪 Simple API Test...\n');

    try {
        // 1. Register guest
        console.log('1. Registering guest...');
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
        
        console.log(`✅ Guest registered: ${guestResponse.data.user.first_name} (ID: ${guestResponse.data.user.id})`);
        const token = guestResponse.data.token;
        
        // 2. Get users
        console.log('\n2. Getting users...');
        const usersResponse = await axios.get(`${API_BASE}/users`);
        const otherUser = usersResponse.data.find(u => u.id !== guestResponse.data.user.id);
        console.log(`✅ Found other user: ${otherUser.first_name} (ID: ${otherUser.id})`);
        
        // 3. Try to send message
        console.log('\n3. Sending message...');
        const messageResponse = await axios.post(`${API_BASE}/messages/send`, {
            receiverId: otherUser.id,
            content: 'Test message from guest'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ Message sent: ${messageResponse.data.content}`);
        
        // 4. Get conversation
        console.log('\n4. Getting conversation...');
        const conversationResponse = await axios.get(`${API_BASE}/messages/conversation/${otherUser.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ Conversation loaded: ${conversationResponse.data.length} messages`);
        
        console.log('\n🎉 All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

simpleTest(); 