const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

// Конфигурация
const CONFIG = {
  FRONTEND_URL: 'http://localhost:3000',
  BACKEND_URL: 'http://localhost:8000/api',
  SCREENSHOTS_DIR: './test_screenshots/multiuser',
  LOGS_DIR: './test_logs',
  USERS: [
    {
      username: 'testuser1',
      email: 'testuser1@example.com',
      password: 'password123',
      name: 'Тест Пользователь 1'
    },
    {
      username: 'testuser2', 
      email: 'testuser2@example.com',
      password: 'password123',
      name: 'Тест Пользователь 2'
    }
  ],
  WAIT_TIMEOUT: 5000,
  SCREENSHOT_DELAY: 1000
};

// Создаем директории
[CONFIG.SCREENSHOTS_DIR, CONFIG.LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Логгер
class Logger {
  constructor() {
    this.logs = [];
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  success(message) {
    this.log(message, 'SUCCESS');
  }

  warning(message) {
    this.log(message, 'WARNING');
  }

  save() {
    const filename = path.join(CONFIG.LOGS_DIR, `ui_multiuser_${Date.now()}.log`);
    fs.writeFileSync(filename, this.logs.join('\n'));
    console.log(`📝 Логи сохранены в: ${filename}`);
  }
}

// Класс для распознавания текста с скриншотов
class ScreenshotAnalyzer {
  constructor() {
    this.logger = new Logger();
  }

  async analyzeScreenshot(imagePath, description = '') {
    try {
      this.logger.log(`🔍 Анализируем скриншот: ${description}`);
      
      const result = await Tesseract.recognize(imagePath, 'rus+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            process.stdout.write(`\r${m.progress * 100}%`);
          }
        }
      });

      const text = result.data.text.trim();
      this.logger.success(`✅ Распознан текст (${text.length} символов)`);
      
      return {
        text,
        confidence: result.data.confidence,
        words: result.data.words.map(w => w.text),
        lines: result.data.lines.map(l => l.text)
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка распознавания: ${error.message}`);
      return null;
    }
  }

  async findTextInScreenshot(imagePath, searchText) {
    const analysis = await this.analyzeScreenshot(imagePath);
    if (!analysis) return false;
    
    const found = analysis.text.toLowerCase().includes(searchText.toLowerCase());
    this.logger.log(`🔍 Поиск "${searchText}": ${found ? '✅ найдено' : '❌ не найдено'}`);
    return found;
  }
}

// Класс для управления браузерными сессиями
class BrowserSession {
  constructor(name, userData) {
    this.name = name;
    this.userData = userData;
    this.browser = null;
    this.page = null;
    this.logger = new Logger();
  }

  async init() {
    this.logger.log(`🚀 Инициализация сессии: ${this.name}`);
    
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 500,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Очищаем localStorage
    await this.page.goto(CONFIG.FRONTEND_URL);
    await this.page.evaluate(() => localStorage.clear());
    
    this.logger.success(`✅ Сессия ${this.name} инициализирована`);
  }

  async takeScreenshot(filename, description = '') {
    const filepath = path.join(CONFIG.SCREENSHOTS_DIR, `${this.name}_${filename}.png`);
    await this.page.screenshot({ path: filepath, fullPage: true });
    this.logger.log(`📸 Скриншот сохранен: ${filepath} ${description}`);
    return filepath;
  }

  async waitForElement(selector, timeout = CONFIG.WAIT_TIMEOUT) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      this.logger.error(`❌ Элемент не найден: ${selector}`);
      return false;
    }
  }

  async clickElement(selector, description = '') {
    try {
      await this.waitForElement(selector);
      await this.page.click(selector);
      this.logger.log(`🖱️ Клик: ${selector} ${description}`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.SCREENSHOT_DELAY));
      return true;
    } catch (error) {
      this.logger.error(`❌ Ошибка клика: ${selector} - ${error.message}`);
      return false;
    }
  }

  async typeText(selector, text, description = '') {
    try {
      await this.waitForElement(selector);
      await this.page.type(selector, text);
      this.logger.log(`⌨️ Ввод текста: ${text} ${description}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Ошибка ввода: ${selector} - ${error.message}`);
      return false;
    }
  }

  async getElementText(selector) {
    try {
      await this.waitForElement(selector);
      return await this.page.$eval(selector, el => el.textContent.trim());
    } catch (error) {
      this.logger.error(`❌ Ошибка получения текста: ${selector}`);
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log(`🔒 Сессия ${this.name} закрыта`);
    }
  }
}

// Основной класс тестирования
class MultiUserUITester {
  constructor() {
    this.logger = new Logger();
    this.analyzer = new ScreenshotAnalyzer();
    this.sessions = [];
  }

  async init() {
    this.logger.log('🚀 Инициализация многопользовательского UI теста');
    
    // Создаем сессии для каждого пользователя
    for (let i = 0; i < CONFIG.USERS.length; i++) {
      const session = new BrowserSession(`user${i + 1}`, CONFIG.USERS[i]);
      await session.init();
      this.sessions.push(session);
    }
  }

  // Шаг 1: Вход пользователей
  async step1_LoginUsers() {
    this.logger.log('📋 Шаг 1: Вход пользователей в систему');
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const user = CONFIG.USERS[i];
      
      this.logger.log(`🔐 Вход пользователя: ${user.username}`);
      
      // Переходим на главную страницу
      await session.page.goto(CONFIG.FRONTEND_URL);
      await session.takeScreenshot('01_initial', 'Начальная страница');
      
      // Ищем и кликаем кнопку входа (иконка аккаунта в AppBar)
      const loginButton = await session.page.evaluate(() => {
        // Ищем кнопку с aria-label "Войти"
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.getAttribute('aria-label') === 'Войти');
      });
      
      if (loginButton) {
        await session.page.evaluate(btn => btn.click(), loginButton);
        await session.takeScreenshot('02_login_dialog', 'Диалог входа');
        
        // Ищем кнопку "Войти в систему" и кликаем
        const loginSystemButton = await session.page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (dialog) {
            const buttons = Array.from(dialog.querySelectorAll('button'));
            return buttons.find(btn => btn.textContent.includes('Войти в систему'));
          }
          return null;
        });
        
        if (loginSystemButton) {
          await session.page.evaluate(btn => btn.click(), loginSystemButton);
          await session.takeScreenshot('03_login_form', 'Форма входа');
          
          // Ждем появления формы входа
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Ищем поля формы
          const formFields = await session.page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input'));
            return inputs.map(input => ({
              type: input.type,
              placeholder: input.placeholder,
              name: input.name
            }));
          });
          
          this.logger.log(`📋 Найдены поля формы:`, formFields);
          
          // Заполняем форму
          const emailInput = formFields.find(field => field.type === 'email' || field.placeholder?.includes('email'));
          const passwordInput = formFields.find(field => field.type === 'password');
          
          if (emailInput) {
            await session.typeText('input[type="email"], input[placeholder*="email"]', user.email, 'Email');
          }
          if (passwordInput) {
            await session.typeText('input[type="password"]', user.password, 'Пароль');
          }
          
          await session.takeScreenshot('04_form_filled', 'Заполненная форма');
          
          // Отправляем форму
          await session.clickElement('button[type="submit"], button:contains("Войти")', 'Кнопка входа');
          await new Promise(resolve => setTimeout(resolve, 3000));
          await session.takeScreenshot('05_after_login', 'После входа');
          
          // Проверяем успешность входа
          const hasToken = await session.page.evaluate(() => {
            return !!localStorage.getItem('authToken');
          });
          
          if (hasToken) {
            this.logger.success(`✅ Пользователь ${user.username} успешно вошел`);
          } else {
            this.logger.error(`❌ Ошибка входа для ${user.username}`);
          }
        } else {
          this.logger.error(`❌ Кнопка "Войти в систему" не найдена для ${user.username}`);
        }
      } else {
        this.logger.error(`❌ Кнопка входа не найдена для ${user.username}`);
      }
    }
  }

  // Шаг 2: Проверка отображения пользователей в правой панели
  async step2_CheckSidebarRight() {
    this.logger.log('📋 Шаг 2: Проверка правой панели (SidebarRight)');
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const currentUser = CONFIG.USERS[i];
      
      this.logger.log(`👥 Проверяем правую панель для ${currentUser.username}`);
      
      // Ждем загрузки интерфейса
      await new Promise(resolve => setTimeout(resolve, 2000));
      await session.takeScreenshot('06_sidebar_check', 'Проверка правой панели');
      
      // Ищем правую панель
      const sidebarRight = await session.page.$('[data-testid="sidebar-right"]');
      
      if (sidebarRight) {
        this.logger.success(`✅ Правая панель найдена для ${currentUser.username}`);
        
        // Проверяем, есть ли список пользователей
        const userList = await session.page.evaluate(() => {
          const sidebar = document.querySelector('[data-testid="sidebar-right"]');
          if (sidebar) {
            const userItems = sidebar.querySelectorAll('[data-testid="user-item"]');
            return Array.from(userItems).map(item => ({
              name: item.querySelector('[data-testid="user-name"]')?.textContent.trim() || item.textContent.trim(),
              clickable: item.tagName === 'BUTTON' || item.onclick !== null,
              userId: item.getAttribute('data-user-id')
            }));
          }
          return [];
        });
        
        this.logger.log(`📋 Найдено пользователей в панели: ${userList.length}`);
        userList.forEach((user, index) => {
          this.logger.log(`  ${index + 1}. ${user.name} (кликабельный: ${user.clickable})`);
        });
        
        // Проверяем, видит ли текущий пользователь других пользователей
        const otherUsers = userList.filter(user => 
          !user.name.includes(currentUser.name) && 
          !user.name.includes(currentUser.username)
        );
        
        if (otherUsers.length > 0) {
          this.logger.success(`✅ ${currentUser.username} видит других пользователей: ${otherUsers.length}`);
          
          // Пытаемся кликнуть по первому другому пользователю
          const firstOtherUser = otherUsers[0];
          const userElement = await session.page.evaluate((userName) => {
            const sidebar = document.querySelector('[data-testid="sidebar-right"]');
            if (sidebar) {
              const userItems = sidebar.querySelectorAll('[data-testid="user-item"]');
              for (let item of userItems) {
                const userNameElement = item.querySelector('[data-testid="user-name"]');
                if (userNameElement && userNameElement.textContent.includes(userName)) {
                  return true;
                }
              }
            }
            return false;
          }, firstOtherUser.name);
          
          if (userElement) {
            await session.clickElement(`[data-testid="user-item"][data-user-id="${firstOtherUser.userId}"]`, `Клик по ${firstOtherUser.name}`);
            await session.takeScreenshot('07_user_click', `Клик по пользователю ${firstOtherUser.name}`);
          }
        } else {
          this.logger.warning(`⚠️ ${currentUser.username} не видит других пользователей`);
        }
      } else {
        this.logger.error(`❌ Правая панель не найдена для ${currentUser.username}`);
      }
    }
  }

  // Шаг 3: Проверка открытия чата
  async step3_CheckChatOpening() {
    this.logger.log('📋 Шаг 3: Проверка открытия чата');
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const currentUser = CONFIG.USERS[i];
      
      this.logger.log(`💬 Проверяем открытие чата для ${currentUser.username}`);
      
      // Ждем появления чата после клика
      await new Promise(resolve => setTimeout(resolve, 2000));
      await session.takeScreenshot('08_chat_check', 'Проверка чата');
      
      // Проверяем, открылся ли чат
      const chatOpened = await session.page.evaluate(() => {
        // Ищем Drawer с чатом (он открывается справа)
        const chatDrawer = document.querySelector('div[role="presentation"] .MuiDrawer-paper');
        const messageInput = document.querySelector('input[placeholder*="сообщение"], input[placeholder*="message"]');
        const sendButton = document.querySelector('button[aria-label*="отправить"], button[aria-label*="send"]');
        
        return {
          hasDrawer: !!chatDrawer,
          hasInput: !!messageInput,
          hasSendButton: !!sendButton,
          drawerVisible: chatDrawer ? window.getComputedStyle(chatDrawer).transform !== 'translateX(100%)' : false
        };
      });
      
      this.logger.log(`📋 Статус чата для ${currentUser.username}:`, chatOpened);
      
              if (chatOpened.hasDrawer && chatOpened.drawerVisible) {
          this.logger.success(`✅ Чат открылся для ${currentUser.username}`);
          
          if (chatOpened.hasInput) {
            this.logger.success(`✅ Поле ввода сообщения найдено`);
            
            // Пытаемся отправить тестовое сообщение
            await session.typeText('input[placeholder*="сообщение"], input[placeholder*="message"]', 'Привет! Это тестовое сообщение.', 'Тестовое сообщение');
            await session.takeScreenshot('09_message_typed', 'Сообщение введено');
            
            // Ищем кнопку отправки (иконка Send)
            const sendButton = await session.page.evaluate(() => {
              const buttons = document.querySelectorAll('button');
              return buttons.find(btn => 
                btn.querySelector('svg') && 
                btn.querySelector('svg').innerHTML.includes('M2.01 21L23 12 2.01 3 2 10l15 2-15 2z') // Иконка Send
              );
            });
            
            if (sendButton) {
              await session.page.evaluate(btn => btn.click(), sendButton);
              await session.takeScreenshot('10_message_sent', 'Сообщение отправлено');
              this.logger.success(`✅ Сообщение отправлено`);
            } else {
              this.logger.warning(`⚠️ Кнопка отправки не найдена`);
            }
          } else {
            this.logger.warning(`⚠️ Поле ввода сообщения не найдено`);
          }
        } else {
          this.logger.error(`❌ Чат не открылся для ${currentUser.username}`);
        }
    }
  }

  // Шаг 4: Проверка получения сообщений
  async step4_CheckMessageReceiving() {
    this.logger.log('📋 Шаг 4: Проверка получения сообщений');
    
    // Ждем немного, чтобы сообщения могли дойти
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const currentUser = CONFIG.USERS[i];
      
      this.logger.log(`📨 Проверяем получение сообщений для ${currentUser.username}`);
      await session.takeScreenshot('11_messages_check', 'Проверка сообщений');
      
      // Проверяем наличие сообщений
      const messages = await session.page.evaluate(() => {
        const messageElements = document.querySelectorAll('[data-testid="message"], .message, .chat-message');
        return Array.from(messageElements).map(msg => ({
          text: msg.textContent.trim(),
          isOwn: msg.classList.contains('own') || msg.classList.contains('sent'),
          timestamp: msg.querySelector('.timestamp')?.textContent || ''
        }));
      });
      
      this.logger.log(`📋 Найдено сообщений для ${currentUser.username}: ${messages.length}`);
      messages.forEach((msg, index) => {
        this.logger.log(`  ${index + 1}. "${msg.text}" (свое: ${msg.isOwn})`);
      });
      
      if (messages.length > 0) {
        this.logger.success(`✅ Сообщения найдены для ${currentUser.username}`);
      } else {
        this.logger.warning(`⚠️ Сообщения не найдены для ${currentUser.username}`);
      }
    }
  }

  // Шаг 5: Проверка ленты постов
  async step5_CheckFeed() {
    this.logger.log('📋 Шаг 5: Проверка ленты постов');
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const currentUser = CONFIG.USERS[i];
      
      this.logger.log(`📰 Проверяем ленту для ${currentUser.username}`);
      
      // Переходим на главную страницу (ленту)
      await session.page.goto(CONFIG.FRONTEND_URL);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await session.takeScreenshot('12_feed_check', 'Проверка ленты');
      
      // Проверяем наличие постов
      const posts = await session.page.evaluate(() => {
        const postElements = document.querySelectorAll('[data-testid="post"], .post, .feed-item');
        return Array.from(postElements).map(post => ({
          content: post.textContent.trim().substring(0, 100) + '...',
          hasAuthor: !!post.querySelector('[data-testid="author"], .author, .post-author'),
          hasActions: !!post.querySelector('[data-testid="actions"], .actions, .post-actions')
        }));
      });
      
      this.logger.log(`📋 Найдено постов для ${currentUser.username}: ${posts.length}`);
      
      if (posts.length > 0) {
        this.logger.success(`✅ Посты найдены для ${currentUser.username}`);
        
        // Пытаемся создать новый пост
        const createPostButton = await session.page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          return buttons.find(btn => 
            btn.textContent.includes('Создать пост') || 
            btn.textContent.includes('Новый пост') ||
            btn.textContent.includes('+')
          );
        });
        
        if (createPostButton) {
          await session.page.evaluate(btn => btn.click(), createPostButton);
          await session.takeScreenshot('13_create_post', 'Создание поста');
          
          // Заполняем форму поста
          await session.typeText('[data-testid="post-content"], .post-content, textarea', `Тестовый пост от ${currentUser.username} - ${new Date().toLocaleString()}`, 'Содержание поста');
          await session.takeScreenshot('14_post_filled', 'Пост заполнен');
          
          // Отправляем пост
          await session.clickElement('[data-testid="submit-post"], .submit-post, button[type="submit"]', 'Отправка поста');
          await session.takeScreenshot('15_post_sent', 'Пост отправлен');
          this.logger.success(`✅ Пост создан для ${currentUser.username}`);
        } else {
          this.logger.warning(`⚠️ Кнопка создания поста не найдена для ${currentUser.username}`);
        }
      } else {
        this.logger.warning(`⚠️ Посты не найдены для ${currentUser.username}`);
      }
    }
  }

  // Шаг 6: Проверка комментариев и реакций
  async step6_CheckCommentsAndReactions() {
    this.logger.log('📋 Шаг 6: Проверка комментариев и реакций');
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const currentUser = CONFIG.USERS[i];
      
      this.logger.log(`💬 Проверяем комментарии и реакции для ${currentUser.username}`);
      
      // Ждем загрузки постов
      await new Promise(resolve => setTimeout(resolve, 2000));
      await session.takeScreenshot('16_comments_check', 'Проверка комментариев');
      
      // Ищем первый пост для взаимодействия
      const firstPost = await session.page.evaluate(() => {
        const posts = document.querySelectorAll('[data-testid="post"], .post, .feed-item');
        if (posts.length > 0) {
          const post = posts[0];
          return {
            hasCommentButton: !!post.querySelector('[data-testid="comment-button"], .comment-button, button[aria-label*="комментарий"]'),
            hasLikeButton: !!post.querySelector('[data-testid="like-button"], .like-button, button[aria-label*="лайк"]'),
            hasReactions: !!post.querySelector('[data-testid="reactions"], .reactions, .post-reactions')
          };
        }
        return null;
      });
      
      if (firstPost) {
        this.logger.log(`📋 Первый пост найден для ${currentUser.username}:`, firstPost);
        
        // Пытаемся добавить комментарий
        if (firstPost.hasCommentButton) {
          await session.clickElement('[data-testid="comment-button"], .comment-button, button[aria-label*="комментарий"]', 'Кнопка комментария');
          await session.takeScreenshot('17_comment_form', 'Форма комментария');
          
          // Вводим комментарий
          await session.typeText('[data-testid="comment-input"], .comment-input, textarea, input[placeholder*="комментарий"]', `Комментарий от ${currentUser.username}`, 'Текст комментария');
          await session.takeScreenshot('18_comment_typed', 'Комментарий введен');
          
          // Отправляем комментарий
          await session.clickElement('[data-testid="submit-comment"], .submit-comment, button[type="submit"]', 'Отправка комментария');
          await session.takeScreenshot('19_comment_sent', 'Комментарий отправлен');
          this.logger.success(`✅ Комментарий добавлен для ${currentUser.username}`);
        }
        
        // Пытаемся поставить реакцию
        if (firstPost.hasLikeButton) {
          await session.clickElement('[data-testid="like-button"], .like-button, button[aria-label*="лайк"]', 'Кнопка лайка');
          await session.takeScreenshot('20_reaction_added', 'Реакция добавлена');
          this.logger.success(`✅ Реакция добавлена для ${currentUser.username}`);
        }
      } else {
        this.logger.warning(`⚠️ Посты для взаимодействия не найдены для ${currentUser.username}`);
      }
    }
  }

  // Шаг 7: Проверка уведомлений
  async step7_CheckNotifications() {
    this.logger.log('📋 Шаг 7: Проверка уведомлений');
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const currentUser = CONFIG.USERS[i];
      
      this.logger.log(`🔔 Проверяем уведомления для ${currentUser.username}`);
      
      // Ищем иконку уведомлений
      const notificationIcon = await session.page.evaluate(() => {
        const icons = document.querySelectorAll('[data-testid="notifications"], .notifications, .notification-icon, button[aria-label*="уведомление"]');
        return icons.length > 0;
      });
      
      if (notificationIcon) {
        await session.clickElement('[data-testid="notifications"], .notifications, .notification-icon, button[aria-label*="уведомление"]', 'Иконка уведомлений');
        await session.takeScreenshot('21_notifications', 'Уведомления');
        
        // Проверяем наличие уведомлений
        const notifications = await session.page.evaluate(() => {
          const notificationElements = document.querySelectorAll('[data-testid="notification"], .notification, .notification-item');
          return Array.from(notificationElements).map(notif => ({
            text: notif.textContent.trim(),
            isRead: notif.classList.contains('read') || notif.classList.contains('unread') === false
          }));
        });
        
        this.logger.log(`📋 Найдено уведомлений для ${currentUser.username}: ${notifications.length}`);
        notifications.forEach((notif, index) => {
          this.logger.log(`  ${index + 1}. "${notif.text}" (прочитано: ${notif.isRead})`);
        });
        
        if (notifications.length > 0) {
          this.logger.success(`✅ Уведомления найдены для ${currentUser.username}`);
        } else {
          this.logger.warning(`⚠️ Уведомления не найдены для ${currentUser.username}`);
        }
      } else {
        this.logger.warning(`⚠️ Иконка уведомлений не найдена для ${currentUser.username}`);
      }
    }
  }

  // Шаг 8: Проверка профиля пользователя
  async step8_CheckUserProfile() {
    this.logger.log('📋 Шаг 8: Проверка профиля пользователя');
    
    for (let i = 0; i < this.sessions.length; i++) {
      const session = this.sessions[i];
      const currentUser = CONFIG.USERS[i];
      
      this.logger.log(`👤 Проверяем профиль для ${currentUser.username}`);
      
      // Ищем кнопку профиля
      const profileButton = await session.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.includes('Профиль') || 
          btn.textContent.includes('Profile') ||
          btn.querySelector('[data-testid="avatar"], .avatar') !== null
        );
      });
      
      if (profileButton) {
        await session.page.evaluate(btn => btn.click(), profileButton);
        await session.takeScreenshot('22_profile_opened', 'Профиль открыт');
        
        // Проверяем информацию профиля
        const profileInfo = await session.page.evaluate(() => {
          const nameElement = document.querySelector('[data-testid="user-name"], .user-name, .profile-name');
          const bioElement = document.querySelector('[data-testid="user-bio"], .user-bio, .profile-bio');
          const avatarElement = document.querySelector('[data-testid="user-avatar"], .user-avatar, .profile-avatar');
          
          return {
            name: nameElement?.textContent.trim(),
            bio: bioElement?.textContent.trim(),
            hasAvatar: !!avatarElement
          };
        });
        
        this.logger.log(`📋 Информация профиля для ${currentUser.username}:`, profileInfo);
        
        if (profileInfo.name) {
          this.logger.success(`✅ Профиль загружен для ${currentUser.username}`);
        } else {
          this.logger.warning(`⚠️ Профиль не загружен для ${currentUser.username}`);
        }
      } else {
        this.logger.warning(`⚠️ Кнопка профиля не найдена для ${currentUser.username}`);
      }
    }
  }

  // Запуск всех тестов
  async runAllTests() {
    try {
      this.logger.log('🚀 Запуск полного многопользовательского UI теста');
      
      await this.init();
      
      // Выполняем все шаги
      await this.step1_LoginUsers();
      await this.step2_CheckSidebarRight();
      await this.step3_CheckChatOpening();
      await this.step4_CheckMessageReceiving();
      await this.step5_CheckFeed();
      await this.step6_CheckCommentsAndReactions();
      await this.step7_CheckNotifications();
      await this.step8_CheckUserProfile();
      
      this.logger.success('✅ Все тесты завершены успешно!');
      
    } catch (error) {
      this.logger.error(`❌ Ошибка в тестах: ${error.message}`);
    } finally {
      // Закрываем все сессии
      for (const session of this.sessions) {
        await session.close();
      }
      
      // Сохраняем логи
      this.logger.save();
      
      this.logger.log('📸 Все скриншоты сохранены в папке test_screenshots/multiuser/');
      this.logger.log('📝 Логи сохранены в папке test_logs/');
    }
  }
}

// Запуск теста
async function main() {
  const tester = new MultiUserUITester();
  await tester.runAllTests();
}

// Экспорт для использования в других модулях
module.exports = {
  MultiUserUITester,
  BrowserSession,
  ScreenshotAnalyzer,
  Logger
};

// Запускаем если файл вызван напрямую
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  });
} 