const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testChatCreation() {
    console.log('🧪 Testing Chat Creation Logic...\n');

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
        
        // 2. Send message from guest1 to guest2
        console.log('2. Sending message from Guest 1 to Guest 2...');
        const message1Response = await axios.post(`${API_BASE}/messages/send`, {
            receiverId: guest2.id,
            content: 'Привет от первого гостя!'
        }, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        
        console.log(`✅ Message 1 sent: ${message1Response.data.content}\n`);
        
        // 3. Send message from guest2 to guest1
        console.log('3. Sending message from Guest 2 to Guest 1...');
        const message2Response = await axios.post(`${API_BASE}/messages/send`, {
            receiverId: guest1.id,
            content: 'Привет от второго гостя!'
        }, {
            headers: { Authorization: `Bearer ${token2}` }
        });
        
        console.log(`✅ Message 2 sent: ${message2Response.data.content}\n`);
        
        // 4. Check conversations from both sides
        console.log('4. Checking conversations from both sides...');
        
        const conversation1 = await axios.get(`${API_BASE}/messages/conversation/${guest2.id}`, {
            headers: { Authorization: `Bearer ${token1}` }
        });
        
        const conversation2 = await axios.get(`${API_BASE}/messages/conversation/${guest1.id}`, {
            headers: { Authorization: `Bearer ${token2}` }
        });
        
        console.log(`✅ Conversation 1 (Guest 1 → Guest 2): ${conversation1.data.length} messages`);
        console.log(`✅ Conversation 2 (Guest 2 → Guest 1): ${conversation2.data.length} messages`);
        
        // Show message details
        console.log('\n📝 Messages in conversation 1:');
        conversation1.data.forEach((msg, index) => {
            console.log(`  ${index + 1}. [${msg.sender_username}]: ${msg.content}`);
        });
        
        console.log('\n📝 Messages in conversation 2:');
        conversation2.data.forEach((msg, index) => {
            console.log(`  ${index + 1}. [${msg.sender_username}]: ${msg.content}`);
        });
        
        // 5. Check if both conversations have the same messages
        const messages1 = conversation1.data.map(m => m.content).sort();
        const messages2 = conversation2.data.map(m => m.content).sort();
        
        const areEqual = JSON.stringify(messages1) === JSON.stringify(messages2);
        console.log(`\n🔍 Conversations are identical: ${areEqual ? '✅ YES' : '❌ NO'}`);
        
        if (!areEqual) {
            console.log('❌ PROBLEM: Different conversations for the same users!');
        } else {
            console.log('✅ SUCCESS: Both users see the same conversation!');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

testChatCreation(); 