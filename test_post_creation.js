const fetch = require('node-fetch');

async function testPostCreation() {
  console.log('🧪 Тестирование создания поста...');
  
  try {
    // 1. Сначала получаем гостевой токен
    console.log('🔑 Получаем гостевой токен...');
    const guestResponse = await fetch('http://localhost:8000/api/auth/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: `guest_test_${Date.now()}`
      })
    });
    
    if (!guestResponse.ok) {
      throw new Error(`Ошибка получения гостевого токена: ${guestResponse.status}`);
    }
    
    const guestData = await guestResponse.json();
    const token = guestData.token;
    
    console.log('✅ Гостевой токен получен:', token.substring(0, 20) + '...');
    
    // 2. Теперь создаем пост
    console.log('📝 Создаем тестовый пост...');
    const postData = {
      content: `Тестовый пост от скрипта - ${new Date().toLocaleString()}`,
      media_urls: [],
      media_type: null,
      background_color: null,
      privacy: 'public',
      section: 'tribune',
      location: null,
      is_ai_generated: false,
      ai_prompt: null
    };
    
    const postResponse = await fetch('http://localhost:8000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData)
    });
    
    console.log('📊 Статус ответа:', postResponse.status);
    console.log('📋 Заголовки ответа:', Object.fromEntries(postResponse.headers.entries()));
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error('❌ Ошибка создания поста:', errorText);
      throw new Error(`HTTP ${postResponse.status}: ${errorText}`);
    }
    
    const postResult = await postResponse.json();
    console.log('✅ Пост создан успешно:', postResult);
    
    // 3. Проверяем, что пост появился в списке
    console.log('🔍 Проверяем список постов...');
    const postsResponse = await fetch('http://localhost:8000/api/posts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (postsResponse.ok) {
      const posts = await postsResponse.json();
      console.log('📋 Найдено постов:', posts.length);
      if (posts.length > 0) {
        console.log('📄 Последний пост:', posts[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  }
}

testPostCreation(); 