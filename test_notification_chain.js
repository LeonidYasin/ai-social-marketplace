/**
 * Тест цепочки уведомлений
 * -------------------------
 * Проверяет полную цепочку: отправка сообщения → создание уведомления → получение через API
 * 
 * ВАЖНО:
 * - Тестирует только серверную часть (без WebSocket)
 * - Проверяет создание записи в базе данных
 * - Проверяет получение через API
 * - Логирует каждый этап для диагностики
 */

const fetch = require('node-fetch');

async function testNotificationChain() {
  console.log('=== ТЕСТ ЦЕПОЧКИ УВЕДОМЛЕНИЙ ===');
  
  const baseUrl = 'https://social-marketplace-api.onrender.com';
  
  try {
    // 1. Создаем тестового пользователя
    console.log('\n1. Создание тестового пользователя...');
    const testUser = {
      username: `chain_test_${Date.now()}`,
      email: `chain_test${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Chain',
      last_name: 'Test'
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
        content: '🔔 Тестовое уведомление для проверки цепочки!'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Ошибка отправки сообщения: ${messageResponse.status} - ${errorText}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData);
    
    // 3. Ждем немного, чтобы уведомление создалось
    console.log('\n3. Ждем 2 секунды для создания уведомления...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Проверяем уведомления пользователя "Гость 4694" (через логин)
    console.log('\n4. Проверка уведомлений пользователя "Гость 4694"...');
    
    // Сначала логинимся как "Гость 4694"
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'guest_4694',
        password: 'guest123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('⚠️ Не удалось войти как "Гость 4694", проверяем уведомления отправителя...');
      
      // Проверяем уведомления отправителя
      const senderNotificationsResponse = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      if (senderNotificationsResponse.ok) {
        const senderNotifications = await senderNotificationsResponse.json();
        console.log('✅ Уведомления отправителя:', senderNotifications);
        
        if (senderNotifications.notifications && senderNotifications.notifications.length > 0) {
          console.log('🎉 Уведомления создаются!');
          console.log('Количество уведомлений:', senderNotifications.notifications.length);
          console.log('Последнее уведомление:', senderNotifications.notifications[0]);
        } else {
          console.log('⚠️ Уведомления не найдены у отправителя');
        }
      } else {
        const errorText = await senderNotificationsResponse.text();
        console.log('❌ Ошибка получения уведомлений отправителя:', senderNotificationsResponse.status, errorText);
      }
    } else {
      const guestData = await loginResponse.json();
      console.log('✅ Вход как "Гость 4694" выполнен');
      
      // Проверяем уведомления "Гостя 4694"
      const guestNotificationsResponse = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${guestData.token}`
        }
      });
      
      if (guestNotificationsResponse.ok) {
        const guestNotifications = await guestNotificationsResponse.json();
        console.log('✅ Уведомления "Гостя 4694":', guestNotifications);
        
        if (guestNotifications.notifications && guestNotifications.notifications.length > 0) {
          console.log('🎉 Уведомления создаются и доставляются!');
          console.log('Количество уведомлений:', guestNotifications.notifications.length);
          console.log('Последнее уведомление:', guestNotifications.notifications[0]);
        } else {
          console.log('⚠️ Уведомления не найдены у "Гостя 4694"');
        }
      } else {
        const errorText = await guestNotificationsResponse.text();
        console.log('❌ Ошибка получения уведомлений "Гостя 4694":', guestNotificationsResponse.status, errorText);
      }
    }
    
    // 5. Проверяем непрочитанные уведомления
    console.log('\n5. Проверка непрочитанных уведомлений...');
    const unreadResponse = await fetch(`${baseUrl}/api/notifications/unread`, {
      headers: {
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    if (unreadResponse.ok) {
      const unreadData = await unreadResponse.json();
      console.log('✅ Непрочитанные уведомления:', unreadData);
    } else {
      const errorText = await unreadResponse.text();
      console.log('❌ Ошибка получения непрочитанных уведомлений:', unreadResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testNotificationChain(); 