const fetch = require('node-fetch');

async function testNotificationDebug() {
  console.log('=== ТЕСТ ОТЛАДКИ УВЕДОМЛЕНИЙ ===');
  
  const baseUrl = 'https://social-marketplace-api.onrender.com';
  
  try {
    // 1. Создаем тестового пользователя
    console.log('\n1. Создание тестового пользователя...');
    const testUser = {
      username: `notif_debug_${Date.now()}`,
      email: `notif_debug${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Notification',
      last_name: 'Debug'
    };
    
    const registerResponse = await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      throw new Error(`Ошибка регистрации: ${registerResponse.status} - ${errorText}`);
    }
    
    const userData = await registerResponse.json();
    console.log('✅ Пользователь создан:', userData.username, 'ID:', userData.id);
    
    // 2. Отправляем сообщение пользователю "Гость 4694" (ID: 109)
    console.log('\n2. Отправка сообщения пользователю "Гость 4694"...');
    const messageResponse = await fetch(`${baseUrl}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        receiverId: 109,
        content: '🔔 Тестовое уведомление для отладки!'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Ошибка отправки сообщения: ${messageResponse.status} - ${errorText}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData);
    
    // 3. Проверяем уведомления пользователя "Гость 4694"
    console.log('\n3. Проверка уведомлений пользователя "Гость 4694"...');
    const notificationsResponse = await fetch(`${baseUrl}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    if (notificationsResponse.ok) {
      const notifications = await notificationsResponse.json();
      console.log('✅ Уведомления найдены:', notifications);
      
      if (notifications.notifications && notifications.notifications.length > 0) {
        console.log('🎉 Уведомления создаются успешно!');
        console.log('Количество уведомлений:', notifications.notifications.length);
        console.log('Последнее уведомление:', notifications.notifications[0]);
      } else {
        console.log('⚠️ Уведомления не найдены');
      }
    } else {
      const errorText = await notificationsResponse.text();
      console.log('❌ Ошибка получения уведомлений:', notificationsResponse.status, errorText);
    }
    
    // 4. Проверяем уведомления отправителя
    console.log('\n4. Проверка уведомлений отправителя...');
    const senderNotificationsResponse = await fetch(`${baseUrl}/api/notifications`, {
      headers: {
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    if (senderNotificationsResponse.ok) {
      const senderNotifications = await senderNotificationsResponse.json();
      console.log('✅ Уведомления отправителя:', senderNotifications);
    } else {
      const errorText = await senderNotificationsResponse.text();
      console.log('❌ Ошибка получения уведомлений отправителя:', senderNotificationsResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testNotificationDebug(); 