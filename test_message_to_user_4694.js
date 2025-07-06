const io = require('socket.io-client');
const fetch = require('node-fetch');

class MessageTest {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
    this.socket = null;
    this.testUser = null;
    this.targetUserId = 109;
  }

  async init() {
    console.log('🔍 Тест отправки сообщения пользователю 4694...');
    
    // 1. Создаем тестового пользователя
    await this.createTestUser();
    
    // 2. Подключаем WebSocket
    await this.connectWebSocket();
    
    // 3. Отправляем сообщение
    await this.sendMessage();
    
    // 4. Проверяем получение
    await this.checkMessageReceived();
  }

  async createTestUser() {
    console.log('1. Создание тестового пользователя...');
    
    const userData = {
      username: `test_user_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      first_name: 'Тестовый',
      last_name: 'Пользователь'
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        this.testUser = result.user;
        this.testUser.token = result.token;
        console.log('✅ Тестовый пользователь создан:', {
          id: this.testUser.id,
          username: this.testUser.username
        });
      } else {
        const error = await response.text();
        console.error('❌ Ошибка создания пользователя:', error);
        throw new Error('Не удалось создать тестового пользователя');
      }
    } catch (error) {
      console.error('❌ Ошибка при создании пользователя:', error.message);
      throw error;
    }
  }

  async connectWebSocket() {
    console.log('2. Подключение WebSocket...');
    
    return new Promise((resolve, reject) => {
      this.socket = io(this.baseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket подключен, socket.id:', this.socket.id);
        
        // Присоединяемся к чату
        this.socket.emit('join', {
          userId: this.testUser.id,
          username: this.testUser.username,
          avatarUrl: this.testUser.avatar || ''
        });
        
        console.log('📤 Отправлен join с данными:', {
          userId: this.testUser.id,
          username: this.testUser.username
        });
        
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Ошибка подключения WebSocket:', error);
        reject(error);
      });

      this.socket.on('newMessage', (data) => {
        console.log('📥 Получено уведомление newMessage:', data);
      });

      this.socket.on('messageSent', (data) => {
        console.log('📥 Получено подтверждение messageSent:', data);
      });

      // Таймаут подключения
      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error('WebSocket не подключился за 10 секунд'));
        }
      }, 10000);
    });
  }

  async sendMessage() {
    console.log('3. Отправка сообщения пользователю 4694...');
    
    const messageData = {
      receiverId: this.targetUserId,
      content: `Тестовое сообщение от ${this.testUser.username} в ${new Date().toLocaleTimeString()}`,
      senderId: this.testUser.id,
      senderUsername: this.testUser.username
    };

    console.log('📤 Отправляем сообщение через WebSocket:', messageData);
    
    this.socket.emit('sendMessage', messageData);
    
    // Также отправляем через API для надежности
    try {
      const response = await fetch(`${this.baseUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.testUser.token}`
        },
        body: JSON.stringify({
          receiverId: this.targetUserId,
          content: messageData.content
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Сообщение отправлено через API:', result);
      } else {
        const error = await response.text();
        console.warn('⚠️ Ошибка отправки через API:', error);
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при отправке через API:', error.message);
    }
  }

  async checkMessageReceived() {
    console.log('4. Проверка получения сообщения...');
    
    // Ждем немного для обработки сообщения
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Проверяем, есть ли сообщение в базе данных
      const response = await fetch(`${this.baseUrl}/api/messages/conversation/${this.targetUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.testUser.token}`
        }
      });

      if (response.ok) {
        const conversation = await response.json();
        console.log('📋 Получена беседа с пользователем 4694:');
        console.log('- Количество сообщений:', conversation.messages?.length || 0);
        
        if (conversation.messages && conversation.messages.length > 0) {
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          console.log('- Последнее сообщение:', {
            id: lastMessage.id,
            content: lastMessage.content,
            sender_id: lastMessage.sender_id,
            created_at: lastMessage.created_at
          });
        }
      } else {
        const error = await response.text();
        console.warn('⚠️ Ошибка получения беседы:', error);
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при проверке беседы:', error.message);
    }
  }

  async cleanup() {
    console.log('🧹 Очистка...');
    
    if (this.socket) {
      this.socket.disconnect();
      console.log('✅ WebSocket отключен');
    }
  }
}

// Запуск теста
async function runTest() {
  const test = new MessageTest();
  
  try {
    await test.init();
    
    console.log('\n🎯 Результаты тестирования:');
    console.log('- Тестовый пользователь создан');
    console.log('- WebSocket соединение установлено');
    console.log('- Сообщение отправлено пользователю 4694');
    console.log('- Проверка получения завершена');
    
    console.log('\n📋 Проверьте:');
    console.log('1. Логи backend для подтверждения получения сообщения');
    console.log('2. Базу данных на наличие нового сообщения');
    console.log('3. Если пользователь 4694 онлайн - должен получить уведомление');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  } finally {
    await test.cleanup();
  }
}

runTest(); 