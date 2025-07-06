async function finalNotificationTest() {
  console.log('=== ФИНАЛЬНЫЙ ТЕСТ УВЕДОМЛЕНИЙ ===');
  console.log('Отправляем уведомление пользователю "Гость 4694" (ID: 109)');
  
  try {
    // Создаем отправителя
    const sender = {
      username: `final_sender_${Date.now()}`,
      email: `final_sender${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Final',
      last_name: 'Sender'
    };
    
    const registerResponse = await fetch('http://localhost:8000/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sender)
    });
    
    if (!registerResponse.ok) {
      throw new Error(`Ошибка регистрации: ${registerResponse.status}`);
    }
    
    const senderData = await registerResponse.json();
    console.log('✅ Отправитель зарегистрирован:', senderData.username);
    
    // Отправляем сообщение
    console.log('\n📤 Отправляем сообщение...');
    const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${senderData.token}`
      },
      body: JSON.stringify({
        receiverId: 109,
        content: '🎉 ФИНАЛЬНОЕ УВЕДОМЛЕНИЕ! Система уведомлений работает!'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Ошибка отправки: ${messageResponse.status} - ${errorText}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData.id);
    
    // Ждем и проверяем уведомления
    console.log('\n⏳ Ждем 3 секунды...');
    setTimeout(async () => {
      try {
        // Проверяем уведомления для получателя (Гость 4694)
        console.log('\n🔍 Проверяем уведомления для получателя...');
        
        // Создаем тестового пользователя для проверки уведомлений
        const checker = {
          username: `checker_${Date.now()}`,
          email: `checker${Date.now()}@example.com`,
          password: 'testpass123',
          first_name: 'Checker',
          last_name: 'User'
        };
        
        const checkerResponse = await fetch('http://localhost:8000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checker)
        });
        
        if (checkerResponse.ok) {
          const checkerData = await checkerResponse.json();
          
          const notificationsResponse = await fetch('http://localhost:8000/api/notifications', {
            headers: { 'Authorization': `Bearer ${checkerData.token}` }
          });
          
          if (notificationsResponse.ok) {
            const notifications = await notificationsResponse.json();
            console.log('📋 Все уведомления в системе:', notifications);
            
            if (notifications.notifications && notifications.notifications.length > 0) {
              console.log('🎉 УВЕДОМЛЕНИЯ НАЙДЕНЫ!');
              notifications.notifications.forEach((notif, index) => {
                console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
                console.log(`     Получатель: ${notif.user_id}, Тип: ${notif.type}`);
              });
            } else {
              console.log('⚠️ Уведомления не найдены в системе');
            }
          } else {
            console.log('❌ Ошибка получения уведомлений:', notificationsResponse.status);
          }
        }
        
        // Проверяем уведомления для конкретного пользователя (Гость 4694)
        console.log('\n🔍 Проверяем уведомления для пользователя 109...');
        
        // Пытаемся войти как Гость 4694
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
              console.log('🎉 УВЕДОМЛЕНИЯ ДЛЯ ПОЛУЧАТЕЛЯ НАЙДЕНЫ!');
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
        
        console.log('\n🎉 Финальный тест завершен!');
        
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

finalNotificationTest(); 