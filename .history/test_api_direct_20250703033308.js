const axios = require('axios');

async function testAPIDirect() {
  console.log('🚀 Тестируем API напрямую...');
  
  const baseURL = 'http://localhost:8000/api';
  
  try {
    // Тест 1: Регистрация нового пользователя
    console.log('\n📝 Тест 1: Регистрация пользователя');
    
    const registerData = {
      username: 'testuser_api',
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
      bio: 'Test user for API'
    };
    
    console.log('Отправляем данные регистрации:', { ...registerData, password: '***' });
    
    const registerResponse = await axios.post(`${baseURL}/auth/register`, registerData);
    console.log('✅ Регистрация успешна:', {
      userId: registerResponse.data.user.id,
      username: registerResponse.data.user.username,
      hasToken: !!registerResponse.data.token
    });
    
    // Тест 2: Вход с созданными данными
    console.log('\n🔐 Тест 2: Вход пользователя');
    
    const loginData = {
      username: 'test@example.com', // API принимает email как username
      password: 'password123'
    };
    
    console.log('Отправляем данные входа:', { ...loginData, password: '***' });
    
    const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
    console.log('✅ Вход успешен:', {
      userId: loginResponse.data.user.id,
      username: loginResponse.data.user.username,
      hasToken: !!loginResponse.data.token
    });
    
    // Тест 3: Получение списка пользователей (с токеном)
    console.log('\n👥 Тест 3: Получение списка пользователей');
    
    const token = loginResponse.data.token;
    const usersResponse = await axios.get(`${baseURL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Список пользователей получен:', {
      count: usersResponse.data.length,
      users: usersResponse.data.map(u => ({ id: u.id, username: u.username, email: u.email }))
    });
    
    // Тест 4: Проверка текущего пользователя
    console.log('\n👤 Тест 4: Проверка текущего пользователя');
    
    const meResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Данные текущего пользователя:', {
      id: meResponse.data.id,
      username: meResponse.data.username,
      email: meResponse.data.email
    });
    
    console.log('\n✅ Все тесты API прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка API:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 409) {
      console.log('ℹ️ Пользователь уже существует, пробуем войти...');
      
      // Пробуем войти с существующими данными
      try {
        const loginData = {
          username: 'test@example.com',
          password: 'password123'
        };
        
        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
        console.log('✅ Вход успешен с существующим пользователем:', {
          userId: loginResponse.data.user.id,
          hasToken: !!loginResponse.data.token
        });
      } catch (loginError) {
        console.error('❌ Ошибка входа:', loginError.response?.data || loginError.message);
      }
    }
  }
}

testAPIDirect().catch(error => {
  console.error('❌ Критическая ошибка:', error.message);
}); 