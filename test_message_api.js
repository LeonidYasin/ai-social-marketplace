const fetch = require('node-fetch');

async function testMessageAPI() {
  console.log('🚀 Тест API сообщений');
  
  try {
    // 1. Сначала получим список пользователей
    console.log('\n📋 Шаг 1: Получение списка пользователей');
    const usersResponse = await fetch('http://localhost:8000/api/users', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!usersResponse.ok) {
      console.log('❌ Не удалось получить пользователей:', usersResponse.status);
      return;
    }
    
    const users = await usersResponse.json();
    console.log('✅ Пользователи получены:', users.length);
    
    if (users.length < 2) {
      console.log('❌ Нужно минимум 2 пользователя для теста');
      return;
    }
    
    // Берем первых двух пользователей
    const user1 = users[0];
    const user2 = users[1];
    
    console.log('👤 Пользователь 1:', user1.username, '(ID:', user1.id, ')');
    console.log('👤 Пользователь 2:', user2.username, '(ID:', user2.id, ')');
    
    // 2. Регистрируем первого пользователя для получения токена
    console.log('\n🔐 Шаг 2: Регистрация первого пользователя');
    const registerResponse = await fetch('http://localhost:8000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'test_user_1',
        email: 'test1@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User1'
      })
    });
    
    if (!registerResponse.ok) {
      console.log('❌ Ошибка регистрации:', registerResponse.status);
      const errorText = await registerResponse.text();
      console.log('Ошибка:', errorText);
      return;
    }
    
    const registerData = await registerResponse.json();
    const token = registerData.token;
    const senderId = registerData.user.id;
    
    console.log('✅ Пользователь зарегистрирован, токен получен');
    console.log('🔑 Токен:', token.substring(0, 20) + '...');
    console.log('🆔 ID отправителя:', senderId);
    
    // 3. Отправляем сообщение
    console.log('\n💬 Шаг 3: Отправка сообщения');
    const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: user2.id,
        content: 'Тестовое сообщение от API теста'
      })
    });
    
    console.log('📤 Статус отправки:', messageResponse.status);
    
    if (!messageResponse.ok) {
      console.log('❌ Ошибка отправки сообщения');
      const errorText = await messageResponse.text();
      console.log('Ошибка:', errorText);
      return;
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData);
    
    // 4. Получаем историю сообщений
    console.log('\n📥 Шаг 4: Получение истории сообщений');
    const conversationResponse = await fetch(`http://localhost:8000/api/messages/conversation/${user2.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📥 Статус получения истории:', conversationResponse.status);
    
    if (!conversationResponse.ok) {
      console.log('❌ Ошибка получения истории');
      const errorText = await conversationResponse.text();
      console.log('Ошибка:', errorText);
      return;
    }
    
    const conversation = await conversationResponse.json();
    console.log('✅ История сообщений получена:', conversation.length, 'сообщений');
    
    if (conversation.length > 0) {
      console.log('📝 Последнее сообщение:', conversation[conversation.length - 1]);
    }
    
    console.log('\n🎉 ТЕСТ ЗАВЕРШЕН УСПЕШНО!');
    
  } catch (error) {
    console.error('❌ Ошибка в тесте:', error.message);
  }
}

// Запуск теста
testMessageAPI(); 