const fetch = require('node-fetch');

class NotificationDebugTest {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
  }

  async testNotifications() {
    console.log('🔍 Отладка уведомлений о сообщениях...');

    try {
      // 1. Проверяем доступность серверов
      console.log('\n1. Проверка доступности серверов...');
      const backendHealth = await this.checkBackendHealth();
      if (!backendHealth) {
        console.log('❌ Backend недоступен');
        return false;
      }
      console.log('✅ Backend доступен');

      // 2. Получаем список пользователей
      console.log('\n2. Получение списка пользователей...');
      const users = await this.getUsers();
      if (!users || users.length === 0) {
        console.log('❌ Нет пользователей в системе');
        return false;
      }
      console.log(`✅ Найдено ${users.length} пользователей`);
      console.log('Пользователи:', users.map(u => u.username).slice(0, 5));

      // 3. Создаем тестовых пользователей
      console.log('\n3. Создание тестовых пользователей...');
      const user1 = await this.createOrGetUser('test_notif_1', 'test1@notif.com');
      const user2 = await this.createOrGetUser('test_notif_2', 'test2@notif.com');
      
      if (!user1 || !user2) {
        console.log('❌ Не удалось создать тестовых пользователей');
        return false;
      }
      console.log('✅ Тестовые пользователи созданы');

      // 4. Входим под первым пользователем
      console.log('\n4. Вход под первым пользователем...');
      const token1 = await this.loginUser(user1.username, 'testpass123');
      if (!token1) {
        console.log('❌ Не удалось войти под первым пользователем');
        return false;
      }
      console.log('✅ Вход под первым пользователем выполнен');

      // 5. Отправляем сообщение
      console.log('\n5. Отправка тестового сообщения...');
      const message = await this.sendMessage(token1, user2.id, 'Тестовое сообщение для проверки уведомлений!');
      if (!message) {
        console.log('❌ Не удалось отправить сообщение');
        return false;
      }
      console.log('✅ Сообщение отправлено:', message.content);

      // 6. Проверяем WebSocket соединение
      console.log('\n6. Проверка WebSocket соединения...');
      const wsStatus = await this.checkWebSocket();
      console.log('WebSocket статус:', wsStatus);

      console.log('\n🎯 Инструкции для тестирования в браузере:');
      console.log('1. Откройте http://localhost:3000 в двух вкладках');
      console.log('2. В первой вкладке войдите как test_notif_1');
      console.log('3. Во второй вкладке войдите как test_notif_2');
      console.log('4. Отправьте сообщение от одного пользователя другому');
      console.log('5. Проверьте консоль браузера на наличие логов MessageNotifications');
      console.log('6. Проверьте, появилось ли уведомление');

      return true;

    } catch (error) {
      console.error('❌ Ошибка при отладке:', error);
      return false;
    }
  }

  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getUsers() {
    try {
      const response = await fetch(`${this.baseUrl}/api/users`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Ошибка получения пользователей:', error.message);
      return null;
    }
  }

  async createOrGetUser(username, email) {
    try {
      // Сначала пытаемся найти существующего пользователя
      const users = await this.getUsers();
      if (users) {
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
          console.log(`✅ Найден существующий пользователь ${username}`);
          return existingUser;
        }
      }

      // Создаем нового пользователя
      const response = await fetch(`${this.baseUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password: 'testpass123',
          first_name: username,
          last_name: 'Test'
        })
      });

      if (response.ok) {
        const userData = await response.json();
        console.log(`✅ Создан новый пользователь ${username}`);
        return userData.user;
      } else {
        console.log(`❌ Ошибка создания пользователя ${username}:`, response.status);
        return null;
      }
    } catch (error) {
      console.error(`❌ Ошибка создания/поиска пользователя ${username}:`, error.message);
      return null;
    }
  }

  async loginUser(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (response.ok) {
        const loginData = await response.json();
        return loginData.token;
      } else {
        console.log(`❌ Ошибка входа для ${username}:`, response.status);
        return null;
      }
    } catch (error) {
      console.error(`❌ Ошибка входа для ${username}:`, error.message);
      return null;
    }
  }

  async sendMessage(token, receiverId, content) {
    try {
      const response = await fetch(`${this.baseUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId,
          content
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.log('❌ Ошибка отправки сообщения:', response.status);
        const errorText = await response.text();
        console.log('Детали ошибки:', errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Ошибка при отправке сообщения:', error);
      return null;
    }
  }

  async checkWebSocket() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (response.ok) {
        return 'Backend доступен, WebSocket должен работать';
      }
      return 'Backend недоступен';
    } catch (error) {
      return 'Ошибка подключения к backend';
    }
  }
}

// Запуск теста
async function runNotificationDebugTest() {
  const test = new NotificationDebugTest();
  
  try {
    const result = await test.testNotifications();
    
    if (result) {
      console.log('\n🎉 Отладка уведомлений завершена успешно!');
    } else {
      console.log('\n❌ Отладка уведомлений завершилась с ошибками');
    }
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем тест
if (require.main === module) {
  runNotificationDebugTest();
}

module.exports = NotificationDebugTest; 

async function testNotificationsDebug() {
  console.log('=== ОТЛАДКА СИСТЕМЫ УВЕДОМЛЕНИЙ ===');
  
  // Тест 1: Регистрация пользователя
  console.log('\n1. Регистрация тестового пользователя...');
  const testUser = {
    username: `test_user_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpass123',
    first_name: 'Test',
    last_name: 'User'
  };
  
  try {
    const registerResponse = await fetch('http://localhost:8000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('Статус регистрации:', registerResponse.status);
    
    if (registerResponse.ok) {
      const userData = await registerResponse.json();
      console.log('✅ Пользователь зарегистрирован:', userData);
      
      // Тест 2: Получение списка пользователей
      console.log('\n2. Получение списка пользователей...');
      const usersResponse = await fetch('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        console.log('✅ Пользователи получены:', users.length, 'пользователей');
        
        // Найдем пользователя с ID 1 или другого существующего
        const targetUser = users.find(u => u.id !== userData.id);
        if (targetUser) {
          console.log('✅ Найден получатель:', targetUser);
          
          // Тест 3: Отправка сообщения
          console.log('\n3. Отправка тестового сообщения...');
          const messageData = {
            receiverId: targetUser.id,
            content: 'Тестовое сообщение для проверки уведомлений'
          };
          
          console.log('Отправляем данные:', messageData);
          
          const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify(messageData)
          });
          
          console.log('Статус отправки сообщения:', messageResponse.status);
          
          if (messageResponse.ok) {
            const messageResult = await messageResponse.json();
            console.log('✅ Сообщение отправлено:', messageResult);
            
            // Тест 4: Проверка создания уведомления
            console.log('\n4. Проверка создания уведомления...');
            setTimeout(async () => {
              const notificationsResponse = await fetch(`http://localhost:8000/api/notifications/user/${targetUser.id}`, {
                headers: {
                  'Authorization': `Bearer ${userData.token}`
                }
              });
              
              console.log('Статус получения уведомлений:', notificationsResponse.status);
              
              if (notificationsResponse.ok) {
                const notifications = await notificationsResponse.json();
                console.log('✅ Уведомления найдены:', notifications);
                
                if (notifications.length > 0) {
                  console.log('✅ Система уведомлений работает корректно!');
                } else {
                  console.log('⚠️ Уведомления не найдены');
                }
              } else {
                const errorText = await notificationsResponse.text();
                console.log('❌ Ошибка получения уведомлений:', errorText);
              }
              
              process.exit(0);
            }, 2000);
            
          } else {
            const errorText = await messageResponse.text();
            console.log('❌ Ошибка отправки сообщения:', errorText);
            process.exit(1);
          }
          
        } else {
          console.log('❌ Не найден получатель для сообщения');
          process.exit(1);
        }
        
      } else {
        const errorText = await usersResponse.text();
        console.log('❌ Ошибка получения пользователей:', errorText);
        process.exit(1);
      }
      
    } else {
      const errorText = await registerResponse.text();
      console.log('❌ Ошибка регистрации:', errorText);
      process.exit(1);
    }
    
  } catch (error) {
    console.log('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

testNotificationsDebug(); 