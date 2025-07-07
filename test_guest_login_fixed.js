const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testGuestLogin() {
  console.log('=== Testing Guest Login ===');
  console.log('='.repeat(50));
  
  try {
    // Шаг 1: Создание гостевого пользователя
    console.log('1. Creating guest user...');
    const guestData = {
      username: `guest_${Date.now()}`,
      email: `guest_${Date.now()}@example.com`,
      password: 'guest123',
      first_name: 'Guest',
      last_name: 'User'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, guestData);
    console.log('✅ Guest user created successfully');
    console.log('User ID:', registerResponse.data.user.id);
    console.log('Token:', registerResponse.data.token.substring(0, 20) + '...');
    
    // Шаг 2: Вход с созданными учетными данными
    console.log('\n2. Logging in with guest credentials...');
    const loginData = {
      username: guestData.username,
      password: guestData.password
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user.username);
    console.log('Token:', loginResponse.data.token.substring(0, 20) + '...');
    
    // Шаг 3: Проверка получения текущего пользователя
    console.log('\n3. Getting current user...');
    const token = loginResponse.data.token;
    const currentUserResponse = await axios.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Current user retrieved successfully');
    console.log('User data:', {
      id: currentUserResponse.data.user.id,
      username: currentUserResponse.data.user.username,
      email: currentUserResponse.data.user.email
    });
    
    // Шаг 4: Проверка списка пользователей
    console.log('\n4. Getting users list...');
    const usersResponse = await axios.get(`${API_BASE}/users`);
    console.log('✅ Users list retrieved successfully');
    console.log('Total users:', usersResponse.data.length);
    
    console.log('\n=== Test completed successfully! ===');
    
  } catch (error) {
    console.error('\n❌ Error during test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    // Проверяем, есть ли ошибки в логах
    console.log('\n=== Checking backend logs for errors ===');
    try {
      const fs = require('fs');
      const backendLog = fs.readFileSync('backend/logs/backend.log', 'utf8');
      const recentErrors = backendLog.split('\n')
        .filter(line => line.includes('[ERROR]'))
        .slice(-5);
      
      if (recentErrors.length > 0) {
        console.log('Recent backend errors:');
        recentErrors.forEach(error => console.log('-', error));
      }
    } catch (logError) {
      console.error('Error reading logs:', logError.message);
    }
  }
}

// Запускаем тест
testGuestLogin(); 