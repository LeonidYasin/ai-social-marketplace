async function simpleMessageTest() {
  console.log('=== ПРОСТОЙ ТЕСТ ОТПРАВКИ СООБЩЕНИЯ ===');
  
  try {
    // Создаем пользователя
    const testUser = {
      username: `simple_test_${Date.now()}`,
      email: `simple_test${Date.now()}@example.com`,
      password: 'testpass123',
      first_name: 'Simple',
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
    console.log('✅ Пользователь зарегистрирован');
    
    // Отправляем сообщение
    console.log('\n📤 Отправляем сообщение...');
    const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        receiverId: 109,
        content: '🔔 Простое тестовое сообщение!'
      })
    });
    
    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(`Ошибка отправки: ${messageResponse.status} - ${errorText}`);
    }
    
    const messageData = await messageResponse.json();
    console.log('✅ Сообщение отправлено:', messageData.id);
    
    console.log('\n🎉 Тест завершен! Проверьте логи backend для деталей.');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

simpleMessageTest(); 