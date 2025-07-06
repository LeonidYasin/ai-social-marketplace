const Notification = require('./backend/src/models/notification');

async function testNotificationModel() {
  console.log('=== ТЕСТ МОДЕЛИ УВЕДОМЛЕНИЙ ===');
  
  try {
    // Тест 1: Создание уведомления напрямую
    console.log('\n1. Создание уведомления напрямую...');
    
    const notificationData = {
      sender_id: 1,
      chat_id: 1,
      message_id: 40
    };
    
    const notification = await Notification.create(
      109, // receiver_id (Гость 4694)
      'message',
      'Тестовое уведомление от модели',
      'Новое сообщение',
      notificationData
    );
    
    console.log('✅ Уведомление создано:', notification);
    
    // Тест 2: Получение уведомлений пользователя
    console.log('\n2. Получение уведомлений пользователя 109...');
    const userNotifications = await Notification.getByUserId(109);
    console.log('✅ Уведомления пользователя:', userNotifications);
    
    // Тест 3: Получение непрочитанных уведомлений
    console.log('\n3. Получение непрочитанных уведомлений...');
    const unreadNotifications = await Notification.getUnreadByUserId(109);
    console.log('✅ Непрочитанные уведомления:', unreadNotifications);
    
    console.log('\n🎉 Тест модели завершен!');
    
  } catch (error) {
    console.error('❌ Ошибка в модели уведомлений:', error);
  }
}

testNotificationModel(); 