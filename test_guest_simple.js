const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testGuestLogin() {
  console.log('🧪 Простой тест гостевого входа...\n');
  
  try {
    // 1. Тестируем регистрацию гостевого пользователя
    console.log('1️⃣ Регистрируем гостевого пользователя...');
    
    const password = Math.random().toString(36).slice(-8);
    const guestData = {
      username: `guest_test_${Date.now()}`,
      email: `guest_test_${Date.now()}@example.com`,
      password: password,
      first_name: 'Гость',
      last_name: 'Тест'
    };
    
    console.log('📝 Данные:', guestData);
    
    const registerResponse = await axios.post(`${API_BASE}/users/register`, guestData);
    
    console.log('✅ Регистрация успешна!');
    console.log('📊 Статус:', registerResponse.status);
    console.log('📄 Ответ:', registerResponse.data);
    
    // 2. Тестируем вход с созданными данными
    console.log('\n2️⃣ Входим с созданными данными...');
    
    const loginData = {
      email: guestData.email,
      password: password
    };
    
    const loginResponse = await axios.post(`${API_BASE}/users/login`, loginData);
    
    console.log('✅ Вход успешен!');
    console.log('📊 Статус:', loginResponse.status);
    console.log('🔑 Токен получен:', !!loginResponse.data.token);
    
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.status || error.code);
    console.error('📄 Ответ:', error.response?.data || error.message);
    return false;
  }
}

// Запускаем тест
testGuestLogin().then(success => {
  console.log(`\n🏁 Тест завершен: ${success ? 'УСПЕХ' : 'ОШИБКА'}`);
  process.exit(success ? 0 : 1);
}); 