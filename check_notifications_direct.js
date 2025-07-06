async function checkNotificationsDirect() {
  console.log('=== ПРЯМАЯ ПРОВЕРКА УВЕДОМЛЕНИЙ ===');
  
  try {
    // Создаем пользователя для доступа к API
    const testUser = {
      username: `direct_check_${Date.now()}`,
      email: `direct_check${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Direct',
      last_name: 'Check'
    };
    
    const registerResponse = await fetch('http://localhost:8000/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      throw new Error(`Ошибка регистрации: ${registerResponse.status}`);
    }
    
    const userData = await registerResponse.json();
    console.log('✅ Пользователь зарегистрирован для проверки');
    
    // Проверяем все уведомления
    console.log('\n1. Проверка всех уведомлений...');
    const allNotificationsResponse = await fetch('http://localhost:8000/api/notifications', {
      headers: { 'Authorization': `Bearer ${userData.token}` }
    });
    
    if (allNotificationsResponse.ok) {
      const allNotifications = await allNotificationsResponse.json();
      console.log('📋 Все уведомления:', allNotifications);
    } else {
      console.log('❌ Ошибка получения всех уведомлений:', allNotificationsResponse.status);
    }
    
    // Проверяем непрочитанные уведомления
    console.log('\n2. Проверка непрочитанных уведомлений...');
    const unreadResponse = await fetch('http://localhost:8000/api/notifications/unread', {
      headers: { 'Authorization': `Bearer ${userData.token}` }
    });
    
    if (unreadResponse.ok) {
      const unread = await unreadResponse.json();
      console.log('📋 Непрочитанные уведомления:', unread);
    } else {
      console.log('❌ Ошибка получения непрочитанных:', unreadResponse.status);
    }
    
    // Проверяем количество непрочитанных
    console.log('\n3. Проверка количества непрочитанных...');
    const countResponse = await fetch('http://localhost:8000/api/notifications/unread/count', {
      headers: { 'Authorization': `Bearer ${userData.token}` }
    });
    
    if (countResponse.ok) {
      const count = await countResponse.json();
      console.log('📊 Количество непрочитанных:', count);
    } else {
      console.log('❌ Ошибка получения количества:', countResponse.status);
    }
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

checkNotificationsDirect(); 