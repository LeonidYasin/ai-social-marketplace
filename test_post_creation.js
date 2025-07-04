const fetch = require('node-fetch');

const API_BASE = 'http://localhost:8000/api';

async function testPostCreation() {
  console.log('🚀 Тестируем создание поста...');
  
  try {
    // Сначала входим в систему
    console.log('📝 Шаг 1: Вход в систему...');
    const loginResponse = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@test.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📝 Ответ входа:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.token) {
      console.error('❌ Не удалось получить токен');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Токен получен:', token.substring(0, 20) + '...');
    
    // Создаем пост
    console.log('\n📝 Шаг 2: Создание поста...');
    const postData = {
      content: 'Тестовый пост для отладки! 🎉',
      privacy: 'public',
      section: 'general'
    };
    
    console.log('📝 Отправляем данные:', JSON.stringify(postData, null, 2));
    
    const postResponse = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData)
    });
    
    const postResult = await postResponse.json();
    console.log('📝 Ответ создания поста:', JSON.stringify(postResult, null, 2));
    console.log('📝 Статус ответа:', postResponse.status);
    
    if (postResponse.ok) {
      console.log('✅ Пост успешно создан!');
    } else {
      console.log('❌ Ошибка создания поста');
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

testPostCreation(); 