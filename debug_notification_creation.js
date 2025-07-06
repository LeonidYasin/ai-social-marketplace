async function debugNotificationCreation() {
  console.log('=== ОТЛАДКА СОЗДАНИЯ УВЕДОМЛЕНИЙ ===');
  
  try {
    // Создаем пользователя
    const testUser = {
      username: `debug_test_${Date.now()}`,
      email: `debug_test${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Debug',
      last_name: 'Test'
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
    console.log('✅ Пользователь зарегистрирован:', userData.username);
    
    // Отправляем сообщение
    console.log('\n📤 Отправляем сообщение пользователю "Гость 4694" (ID: 109)...');
    const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        receiverId: 109,
        content: '🔔 Отладочное уведомление! Проверяем создание уведомлений.'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Ошибка отправки: ${messageResponse.status} - ${errorText}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData);
    
    // Ждем и проверяем уведомления
    console.log('\n⏳ Ждем 3 секунды и проверяем уведомления...');
    setTimeout(async () => {
      try {
        const notificationsResponse = await fetch('http://localhost:8000/api/notifications', {
          headers: { 'Authorization': `Bearer ${userData.token}` }
        });
        
        if (notificationsResponse.ok) {
          const notifications = await notificationsResponse.json();
          console.log('📋 Уведомления:', notifications);
          
          if (notifications.notifications && notifications.notifications.length > 0) {
            console.log('🎉 Уведомления найдены!');
            notifications.notifications.forEach((notif, index) => {
              console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
            });
          } else {
            console.log('⚠️ Уведомления не найдены');
          }
        } else {
          console.log('❌ Ошибка получения уведомлений:', notificationsResponse.status);
        }
        
        // Проверяем уведомления для получателя
        console.log('\n🔍 Проверяем уведомления для получателя (Гость 4694)...');
        
        // Сначала нужно войти как Гость 4694
        const guestLoginResponse = await fetch('http://localhost:8000/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'guest_469492e4_4g6cde',
            password: 'guest_password'
          })
        });
        
        if (guestLoginResponse.ok) {
          const guestData = await guestLoginResponse.json();
          console.log('✅ Вход под Гость 4694 выполнен');
          
          const guestNotificationsResponse = await fetch('http://localhost:8000/api/notifications', {
            headers: { 'Authorization': `Bearer ${guestData.token}` }
          });
          
          if (guestNotificationsResponse.ok) {
            const guestNotifications = await guestNotificationsResponse.json();
            console.log('📋 Уведомления для Гость 4694:', guestNotifications);
            
            if (guestNotifications.notifications && guestNotifications.notifications.length > 0) {
              console.log('🎉 Уведомления для получателя найдены!');
              guestNotifications.notifications.forEach((notif, index) => {
                console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
              });
            } else {
              console.log('⚠️ Уведомления для получателя не найдены');
            }
          } else {
            console.log('❌ Ошибка получения уведомлений для получателя:', guestNotificationsResponse.status);
          }
        } else {
          console.log('❌ Не удалось войти под Гость 4694');
        }
        
      } catch (error) {
        console.log('❌ Ошибка при проверке:', error.message);
      }
      
      process.exit(0);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

debugNotificationCreation(); 