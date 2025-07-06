const puppeteer = require('puppeteer');
const io = require('socket.io-client');

class NotificationTest {
  constructor() {
    this.browser = null;
    this.pages = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
  }

  async createPage() {
    const page = await this.browser.newPage();
    
    // Разрешаем уведомления
    const context = page.context();
    await context.grantPermissions(['notifications']);
    
    // Слушаем запросы на разрешение уведомлений
    page.on('dialog', async dialog => {
      if (dialog.type() === 'beforeunload') {
        await dialog.accept();
      }
    });

    // Устанавливаем разрешение на уведомления
    await page.evaluateOnNewDocument(() => {
      // Запрашиваем разрешение на уведомления
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    });

    return page;
  }

  async testNotifications() {
    console.log('=== ТЕСТ СИСТЕМЫ УВЕДОМЛЕНИЙ ===');
    
    // Тест 1: Подключение WebSocket
    console.log('\n1. Тестирование WebSocket подключения...');
    const socket = io('http://localhost:8000');
    
    socket.on('connect', () => {
      console.log('✅ WebSocket подключен успешно');
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Ошибка подключения WebSocket:', error.message);
    });
    
    // Тест 2: Регистрация пользователя
    console.log('\n2. Регистрация тестового пользователя...');
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
      
      if (registerResponse.ok) {
        const userData = await registerResponse.json();
        console.log('✅ Пользователь зарегистрирован:', userData.username);
        
        // Тест 3: Отправка сообщения
        console.log('\n3. Отправка тестового сообщения...');
        const messageResponse = await fetch('http://localhost:8000/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
          },
                  body: JSON.stringify({
          receiverId: 1, // Отправляем сообщение пользователю с ID 1
          content: 'Тестовое сообщение для проверки уведомлений'
        })
        });
        
        if (messageResponse.ok) {
          const messageData = await messageResponse.json();
          console.log('✅ Сообщение отправлено:', messageData);
          
          // Тест 4: Проверка создания уведомления
          console.log('\n4. Проверка создания уведомления...');
          setTimeout(async () => {
            const notificationsResponse = await fetch(`http://localhost:8000/api/notifications/user/${userData.id}`, {
              headers: {
                'Authorization': `Bearer ${userData.token}`
              }
            });
            
            if (notificationsResponse.ok) {
              const notifications = await notificationsResponse.json();
              console.log('✅ Уведомления найдены:', notifications);
              
              if (notifications.length > 0) {
                console.log('✅ Система уведомлений работает корректно!');
              } else {
                console.log('⚠️ Уведомления не найдены');
              }
            } else {
              console.log('❌ Ошибка получения уведомлений:', notificationsResponse.status);
            }
            
            socket.disconnect();
            process.exit(0);
          }, 2000);
          
        } else {
          console.log('❌ Ошибка отправки сообщения:', messageResponse.status);
          socket.disconnect();
          process.exit(1);
        }
        
      } else {
        console.log('❌ Ошибка регистрации:', registerResponse.status);
        socket.disconnect();
        process.exit(1);
      }
      
    } catch (error) {
      console.log('❌ Ошибка:', error.message);
      socket.disconnect();
      process.exit(1);
    }
  }

  async registerUser(page, username, email) {
    try {
      // Нажимаем на кнопку профиля
      await page.click('[data-testid="profile-button"]');
      await page.waitForTimeout(1000);

      // Нажимаем "Войти как гость"
      const guestButton = await page.$('button:has-text("Войти как гость")');
      if (guestButton) {
        await guestButton.click();
        await page.waitForTimeout(1000);
      }

      // Заполняем форму регистрации
      await page.fill('input[placeholder*="имя"]', username);
      await page.fill('input[placeholder*="email"]', email);
      
      // Нажимаем кнопку регистрации
      const registerButton = await page.$('button:has-text("Зарегистрироваться")');
      if (registerButton) {
        await registerButton.click();
        await page.waitForTimeout(2000);
      }

    } catch (error) {
      console.log(`Пользователь ${username} уже зарегистрирован или ошибка регистрации:`, error.message);
    }
  }

  async openChat(page) {
    try {
      // Ищем кнопку чата в правом сайдбаре
      const chatButton = await page.$('button[aria-label*="чат"], button[title*="чат"], .MuiIconButton-root:has(svg)');
      if (chatButton) {
        await chatButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('Ошибка при открытии чата:', error.message);
    }
  }

  async sendMessage(page, receiverUsername, message) {
    try {
      // Ищем поле ввода сообщения
      const messageInput = await page.$('input[placeholder*="сообщение"], textarea[placeholder*="сообщение"]');
      if (messageInput) {
        await messageInput.fill(message);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('Ошибка при отправке сообщения:', error.message);
    }
  }

  async checkNotification(page) {
    try {
      // Ищем уведомление в интерфейсе
      const notification = await page.$('.MuiSnackbar-root, .MuiAlert-root, [role="alert"]');
      return !!notification;
    } catch (error) {
      return false;
    }
  }

  async checkBrowserNotification(page) {
    try {
      // Проверяем разрешение на уведомления
      const permission = await page.evaluate(() => {
        return Notification.permission;
      });
      
      return permission === 'granted';
    } catch (error) {
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Запуск теста
async function runNotificationTest() {
  const test = new NotificationTest();
  
  try {
    await test.init();
    await test.testNotifications();
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  } finally {
    await test.cleanup();
  }
}

// Запускаем тест
if (require.main === module) {
  runNotificationTest();
}

module.exports = NotificationTest; 