async function checkNotifications() {
  console.log('=== ПРОВЕРКА УВЕДОМЛЕНИЙ В БАЗЕ ===');
  
  try {
    // Создаем тестового пользователя для доступа к API
    const testUser = {
      username: `checker_${Date.now()}`,
      email: `checker${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Checker',
      last_name: 'User'
    };
    
    // Регистрируем пользователя
    const registerResponse = await fetch('http://localhost:8000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      throw new Error(`Ошибка регистрации: ${registerResponse.status}`);
    }
    
    const userData = await registerResponse.json();
    console.log('✅ Пользователь зарегистрирован для проверки');
    
    // Проверяем разные эндпоинты уведомлений
    console.log('\n1. Проверка /api/notifications...');
    try {
      const notificationsResponse = await fetch('http://localhost:8000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      console.log('Статус:', notificationsResponse.status);
      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json();
        console.log('✅ Уведомления получены:', notifications);
      } else {
        const errorText = await notificationsResponse.text();
        console.log('❌ Ошибка:', errorText);
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error.message);
    }
    
    // Проверяем непрочитанные уведомления
    console.log('\n2. Проверка /api/notifications/unread...');
    try {
      const unreadResponse = await fetch('http://localhost:8000/api/notifications/unread', {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      console.log('Статус:', unreadResponse.status);
      if (unreadResponse.ok) {
        const unread = await unreadResponse.json();
        console.log('✅ Непрочитанные уведомления:', unread);
      } else {
        const errorText = await unreadResponse.text();
        console.log('❌ Ошибка:', errorText);
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error.message);
    }
    
    // Проверяем количество непрочитанных
    console.log('\n3. Проверка /api/notifications/unread/count...');
    try {
      const countResponse = await fetch('http://localhost:8000/api/notifications/unread/count', {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      console.log('Статус:', countResponse.status);
      if (countResponse.ok) {
        const count = await countResponse.json();
        console.log('✅ Количество непрочитанных:', count);
      } else {
        const errorText = await countResponse.text();
        console.log('❌ Ошибка:', errorText);
      }
    } catch (error) {
      console.log('❌ Ошибка запроса:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error.message);
  }
}

checkNotifications(); 