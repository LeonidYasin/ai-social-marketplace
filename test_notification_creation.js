async function testNotificationCreation() {
  console.log('=== ТЕСТ СОЗДАНИЯ УВЕДОМЛЕНИЯ ===');
  
  try {
    // Создаем тестового пользователя
    const testUser = {
      username: `notif_test_${Date.now()}`,
      email: `notif_test${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Notification',
      last_name: 'Test'
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
    console.log('✅ Пользователь зарегистрирован:', userData.username);
    
    // Отправляем сообщение пользователю "Гость 4694" (ID: 109)
    console.log('\n1. Отправка сообщения пользователю "Гость 4694"...');
    const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        receiverId: 109,
        content: '🔔 Тестовое уведомление для проверки создания!'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Ошибка отправки сообщения: ${messageResponse.status} - ${errorText}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData);
    
    // Ждем немного и проверяем уведомления
    console.log('\n2. Проверка уведомлений через 3 секунды...');
    setTimeout(async () => {
      try {
        const notificationsResponse = await fetch('http://localhost:8000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        });
        
        if (notificationsResponse.ok) {
          const notifications = await notificationsResponse.json();
          console.log('✅ Уведомления получены:', notifications);
          
          if (notifications.notifications && notifications.notifications.length > 0) {
            console.log('🎉 Уведомления созданы успешно!');
            notifications.notifications.forEach((notif, index) => {
              console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
            });
          } else {
            console.log('⚠️ Уведомления не найдены');
          }
        } else {
          const errorText = await notificationsResponse.text();
          console.log('❌ Ошибка получения уведомлений:', errorText);
        }
        
        // Проверяем уведомления для получателя (Гость 4694)
        console.log('\n3. Проверка уведомлений для получателя...');
        try {
          // Сначала нужно войти как Гость 4694
          const guestLoginResponse = await fetch('http://localhost:8000/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: 'guest_469492e4_4g6cde',
              password: 'guest_password'
            })
          });
          
          if (guestLoginResponse.ok) {
            const guestData = await guestLoginResponse.json();
            console.log('✅ Вход под Гость 4694 выполнен');
            
            const guestNotificationsResponse = await fetch('http://localhost:8000/api/notifications', {
              headers: {
                'Authorization': `Bearer ${guestData.token}`
              }
            });
            
            if (guestNotificationsResponse.ok) {
              const guestNotifications = await guestNotificationsResponse.json();
              console.log('✅ Уведомления для Гость 4694:', guestNotifications);
              
              if (guestNotifications.notifications && guestNotifications.notifications.length > 0) {
                console.log('🎉 Уведомления для получателя найдены!');
                guestNotifications.notifications.forEach((notif, index) => {
                  console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
                });
              } else {
                console.log('⚠️ Уведомления для получателя не найдены');
              }
            } else {
              const errorText = await guestNotificationsResponse.text();
              console.log('❌ Ошибка получения уведомлений для получателя:', errorText);
            }
          } else {
            console.log('❌ Не удалось войти под Гость 4694');
          }
        } catch (error) {
          console.log('❌ Ошибка при проверке уведомлений получателя:', error.message);
        }
        
      } catch (error) {
        console.log('❌ Ошибка при проверке уведомлений:', error.message);
      }
      
      process.exit(0);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

testNotificationCreation(); 