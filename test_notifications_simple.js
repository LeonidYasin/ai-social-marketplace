const fetch = require('node-fetch');

class SimpleNotificationTest {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
    this.users = [];
  }

  async testNotifications() {
    console.log('🧪 Простое тестирование уведомлений...');

    try {
      // Создаем двух пользователей
      const user1 = await this.createUser('testuser1', 'test1@example.com');
      const user2 = await this.createUser('testuser2', 'test2@example.com');

      if (!user1 || !user2) {
        console.log('❌ Не удалось создать пользователей');
        return false;
      }

      console.log('✅ Пользователи созданы:', user1.username, 'и', user2.username);

      // Отправляем сообщение от первого пользователя второму
      const message = await this.sendMessage(user1, user2.id, 'Тестовое сообщение для проверки уведомлений!');
      
      if (message) {
        console.log('✅ Сообщение отправлено:', message.content);
        console.log('📤 Отправитель:', user1.username);
        console.log('📥 Получатель:', user2.username);
        
        console.log('\n🎯 Теперь проверьте в браузере:');
        console.log('1. Откройте http://localhost:3000 в двух вкладках');
        console.log('2. Войдите как пользователи testuser1 и testuser2');
        console.log('3. Отправьте сообщение от одного пользователя другому');
        console.log('4. Проверьте, что уведомление появилось в интерфейсе');
        console.log('5. Проверьте браузерные уведомления (если разрешены)');
        
        return true;
      } else {
        console.log('❌ Не удалось отправить сообщение');
        return false;
      }

    } catch (error) {
      console.error('❌ Ошибка при тестировании:', error);
      return false;
    }
  }

  async createUser(username, email) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
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
        console.log(`✅ Пользователь ${username} создан`);
        return userData;
      } else {
        console.log(`⚠️ Пользователь ${username} уже существует или ошибка создания`);
        // Пытаемся получить существующего пользователя
        return await this.getUserByUsername(username);
      }
    } catch (error) {
      console.error(`❌ Ошибка создания пользователя ${username}:`, error.message);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      const response = await fetch(`${this.baseUrl}/api/users`);
      if (response.ok) {
        const users = await response.json();
        console.log('Найденные пользователи:', users.map(u => u.username));
        const user = users.find(u => u.username === username);
        if (user) {
          console.log(`✅ Найден существующий пользователь ${username}`);
          return user;
        } else {
          console.log(`❌ Пользователь ${username} не найден в списке`);
        }
      } else {
        console.log(`❌ Ошибка получения списка пользователей: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка поиска пользователя ${username}:`, error.message);
    }
    return null;
  }

  async sendMessage(sender, receiverId, content) {
    try {
      // Сначала получаем токен для отправителя
      const loginResponse = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: sender.username,
          password: 'testpass123'
        })
      });

      if (!loginResponse.ok) {
        console.log('❌ Не удалось войти в систему');
        return null;
      }

      const loginData = await loginResponse.json();
      const token = loginData.token;

      // Отправляем сообщение
      const messageResponse = await fetch(`${this.baseUrl}/api/messages/send`, {
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

      if (messageResponse.ok) {
        const message = await messageResponse.json();
        return message;
      } else {
        console.log('❌ Ошибка отправки сообщения:', messageResponse.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Ошибка при отправке сообщения:', error);
      return null;
    }
  }
}

// Запуск теста
async function runSimpleNotificationTest() {
  const test = new SimpleNotificationTest();
  
  try {
    const result = await test.testNotifications();
    
    if (result) {
      console.log('\n🎉 Тест уведомлений подготовлен успешно!');
      console.log('📋 Теперь протестируйте уведомления в браузере');
    } else {
      console.log('\n❌ Тест уведомлений завершился с ошибками');
    }
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем тест
if (require.main === module) {
  runSimpleNotificationTest();
}

module.exports = SimpleNotificationTest; 