const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testGuestMessaging() {
    console.log('🧪 Testing Guest Messaging Functionality...\n');

    try {
        // Step 1: Register a new guest user (using the same logic as frontend)
        console.log('1. Registering new guest user...');
        
        // Generate unique guest data like frontend does
        const browserId = `test-browser-${Date.now()}`;
        const uniqueSuffix = Math.random().toString(36).slice(-6);
        const username = `guest_${browserId.slice(0, 8)}_${uniqueSuffix}`;
        const email = `guest_${browserId}_${uniqueSuffix}@example.com`;
        const password = Math.random().toString(36).slice(-8);
        
        const guestResponse = await axios.post(`${API_BASE}/users/register`, {
            username: username,
            email: email,
            password: password,
            first_name: 'Гость',
            last_name: browserId.slice(0, 4),
            bio: 'Гостевой пользователь'
        });
        
        const guestUser = guestResponse.data.user;
        const guestToken = guestResponse.data.token;
        
        console.log(`✅ Guest registered: ${guestUser.first_name} ${guestUser.last_name} (ID: ${guestUser.id})`);
        console.log(`Username: ${guestUser.username}`);
        console.log(`Token: ${guestToken.substring(0, 20)}...\n`);

        // Step 2: Get all users to find another user to chat with
        console.log('2. Fetching all users...');
        const usersResponse = await axios.get(`${API_BASE}/users`);
        const allUsers = usersResponse.data;
        
        // Find a different user (not the current guest)
        const otherUser = allUsers.find(user => user.id !== guestUser.id);
        if (!otherUser) {
            console.log('❌ No other users found to chat with');
            return;
        }
        
        console.log(`✅ Found user to chat with: ${otherUser.first_name} ${otherUser.last_name} (ID: ${otherUser.id})\n`);

        // Step 3: Test loading conversation
        console.log('3. Testing conversation loading...');
        const conversationResponse = await axios.get(
            `${API_BASE}/messages/conversation/${otherUser.id}`,
            {
                headers: { Authorization: `Bearer ${guestToken}` }
            }
        );
        
        console.log(`✅ Conversation loaded successfully`);
        console.log(`Messages in conversation: ${conversationResponse.data.length}\n`);

        // Step 4: Send a test message
        console.log('4. Sending test message...');
        const messageData = {
            receiverId: otherUser.id,
            content: `Hello from guest ${guestUser.first_name}! This is a test message.`
        };
        
        const sendResponse = await axios.post(
            `${API_BASE}/messages/send`,
            messageData,
            {
                headers: { Authorization: `Bearer ${guestToken}` }
            }
        );
        
        console.log(`✅ Message sent successfully`);
        console.log(`Message ID: ${sendResponse.data.id}`);
        console.log(`Content: ${sendResponse.data.content}\n`);

        // Step 5: Verify message appears in conversation
        console.log('5. Verifying message in conversation...');
        const updatedConversation = await axios.get(
            `${API_BASE}/messages/conversation/${otherUser.id}`,
            {
                headers: { Authorization: `Bearer ${guestToken}` }
            }
        );
        
        const newMessageCount = updatedConversation.data.length;
        console.log(`✅ Updated conversation has ${newMessageCount} messages`);
        
        if (newMessageCount > conversationResponse.data.length) {
            console.log('✅ New message successfully added to conversation!');
        } else {
            console.log('❌ Message not found in conversation');
        }

        console.log('\n🎉 Guest messaging test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error(`Status: ${error.response.status}`);
        }
        // Add full error object for debugging
        console.error('Full error:', error);
    }
}

// Run the test
testGuestMessaging(); 