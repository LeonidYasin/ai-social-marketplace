const io = require('socket.io-client');

async function sendNotificationToGuest4694() {
  console.log('=== ОТПРАВКА УВЕДОМЛЕНИЯ ПОЛЬЗОВАТЕЛЮ "ГОСТЬ 4694" ===');
  
  // ID пользователя "Гость 4694"
  const targetUserId = 109;
  
  // Создаем тестового пользователя для отправки сообщения
  const testUser = {
    username: `notification_sender_${Date.now()}`,
    email: `sender${Date.now()}@example.com`,
    password: 'testpass123',
    first_name: 'Notification',
    last_name: 'Sender'
  };
  
  try {
    // 1. Регистрируем отправителя
    console.log('\n1. Регистрация отправителя уведомления...');
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
    
    const senderData = await registerResponse.json();
    console.log('✅ Отправитель зарегистрирован:', senderData.username);
    
    // 2. Отправляем сообщение (это создаст уведомление)
    console.log('\n2. Отправка сообщения для создания уведомления...');
    const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${senderData.token}`
      },
      body: JSON.stringify({
        receiverId: targetUserId,
        content: '🔔 Тестовое уведомление! Это сообщение создаст уведомление для пользователя "Гость 4694".'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Ошибка отправки сообщения: ${messageResponse.status} - ${errorText}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData);
    
    // 3. Проверяем, что уведомление создалось
    console.log('\n3. Проверка создания уведомления...');
    setTimeout(async () => {
      try {
        const notificationsResponse = await fetch(`http://localhost:8000/api/notifications/user/${targetUserId}`, {
          headers: {
            'Authorization': `Bearer ${senderData.token}`
          }
        });
        
        if (notificationsResponse.ok) {
          const notifications = await notificationsResponse.json();
          console.log('✅ Уведомления найдены:', notifications.length, 'шт.');
          
          if (notifications.length > 0) {
            console.log('📋 Последние уведомления:');
            notifications.slice(0, 3).forEach((notif, index) => {
              console.log(`  ${index + 1}. ${notif.title}: ${notif.message}`);
            });
            console.log('\n🎉 Уведомление успешно отправлено пользователю "Гость 4694"!');
          } else {
            console.log('⚠️ Уведомления не найдены');
          }
        } else {
          console.log('❌ Ошибка получения уведомлений:', notificationsResponse.status);
        }
      } catch (error) {
        console.log('❌ Ошибка при проверке уведомлений:', error.message);
      }
      
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

sendNotificationToGuest4694(); 