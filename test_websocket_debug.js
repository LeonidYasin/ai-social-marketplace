const io = require('socket.io-client');

class WebSocketDebugTest {
  constructor() {
    this.socket1 = null;
    this.socket2 = null;
  }

  async testWebSocket() {
    console.log('🔍 Отладка WebSocket соединения...');

    try {
      // Создаем два WebSocket соединения
      console.log('\n1. Создание WebSocket соединений...');
      
      this.socket1 = io('http://localhost:8000');
      this.socket2 = io('http://localhost:8000');

      // Настраиваем обработчики для первого соединения
      this.socket1.on('connect', () => {
        console.log('✅ Socket 1 подключен');
        
        // Присоединяемся как первый пользователь
        this.socket1.emit('join', {
          userId: 'test_user_1',
          username: 'test_user_1',
          avatarUrl: ''
        });
        console.log('📤 Socket 1: отправлен join');
      });

      this.socket1.on('onlineUsers', (users) => {
        console.log('📥 Socket 1: получен список онлайн пользователей:', users.length);
      });

      this.socket1.on('newMessage', (message) => {
        console.log('📥 Socket 1: получено новое сообщение:', message);
      });

      // Настраиваем обработчики для второго соединения
      this.socket2.on('connect', () => {
        console.log('✅ Socket 2 подключен');
        
        // Присоединяемся как второй пользователь
        this.socket2.emit('join', {
          userId: 'test_user_2',
          username: 'test_user_2',
          avatarUrl: ''
        });
        console.log('📤 Socket 2: отправлен join');
      });

      this.socket2.on('onlineUsers', (users) => {
        console.log('📥 Socket 2: получен список онлайн пользователей:', users.length);
      });

      this.socket2.on('newMessage', (message) => {
        console.log('📥 Socket 2: получено новое сообщение:', message);
      });

      // Ждем подключения
      await this.wait(2000);

      // Отправляем тестовое сообщение
      console.log('\n2. Отправка тестового сообщения...');
      this.socket1.emit('sendMessage', {
        receiverId: 'test_user_2',
        content: 'Тестовое сообщение для проверки WebSocket!',
        senderId: 'test_user_1',
        senderUsername: 'test_user_1'
      });
      console.log('📤 Socket 1: отправлено сообщение');

      // Ждем получения сообщения
      await this.wait(3000);

      console.log('\n🎯 Результаты тестирования:');
      console.log('- WebSocket соединения должны быть установлены');
      console.log('- Сообщение должно быть отправлено от Socket 1 к Socket 2');
      console.log('- Socket 2 должен получить уведомление newMessage');

      return true;

    } catch (error) {
      console.error('❌ Ошибка при тестировании WebSocket:', error);
      return false;
    } finally {
      // Закрываем соединения
      if (this.socket1) {
        this.socket1.disconnect();
      }
      if (this.socket2) {
        this.socket2.disconnect();
      }
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Запуск теста
async function runWebSocketDebugTest() {
  const test = new WebSocketDebugTest();
  
  try {
    const result = await test.testWebSocket();
    
    if (result) {
      console.log('\n🎉 Тест WebSocket завершен!');
      console.log('📋 Проверьте логи backend для деталей');
    } else {
      console.log('\n❌ Тест WebSocket завершился с ошибками');
    }
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем тест
if (require.main === module) {
  runWebSocketDebugTest();
}

module.exports = WebSocketDebugTest; 