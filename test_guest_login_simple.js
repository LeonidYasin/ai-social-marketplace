const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testGuestLogin() {
  console.log('=== Simple Guest Login Test ===');
  console.log('='.repeat(50));
  
  try {
    // Шаг 1: Проверка здоровья API
    console.log('1. Checking API health...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ API is healthy:', healthResponse.data.message);
    
    // Шаг 2: Создание гостевого пользователя
    console.log('\n2. Creating guest user...');
    const guestData = {
      username: `guest_${Date.now()}`,
      email: `guest_${Date.now()}@example.com`,
      password: 'guest123',
      first_name: 'Guest',
      last_name: 'User'
    };
    
    console.log('Guest data:', {
      username: guestData.username,
      email: guestData.email,
      first_name: guestData.first_name,
      last_name: guestData.last_name
    });
    
    const registerResponse = await axios.post(`${API_BASE}/users/register`, guestData);
    console.log('✅ Guest user created successfully');
    console.log('User ID:', registerResponse.data.user.id);
    
    // Шаг 3: Вход с созданными учетными данными
    console.log('\n3. Logging in...');
    const loginData = {
      username: guestData.username,
      password: guestData.password
    };
    
    const loginResponse = await axios.post(`${API_BASE}/users/login`, loginData);
    console.log('✅ Login successful');
    console.log('Username:', loginResponse.data.user.username);
    
    // Шаг 4: Проверка токена
    console.log('\n4. Testing token...');
    const token = loginResponse.data.token;
    const currentUserResponse = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token is valid');
    console.log('Current user:', currentUserResponse.data.user.username);
    
    console.log('\n=== Test completed successfully! ===');
    console.log('Guest login is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 500) {
        console.error('\n🔍 Server error detected. Checking logs...');
        // Здесь можно добавить проверку логов
      }
    } else if (error.request) {
      console.error('Request error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Запускаем тест
testGuestLogin(); 