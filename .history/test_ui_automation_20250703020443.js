const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Создаем папку для логов если её нет
const logsDir = './test_logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Функция для записи логов
const writeLog = (filename, content) => {
  const timestamp = new Date().toISOString();
  const logContent = `[${timestamp}] ${content}\n`;
  fs.appendFileSync(path.join(logsDir, filename), logContent);
  console.log(content);
};

// Функция для очистки логов
const clearLogs = () => {
  const files = ['ui_test.log', 'users_panel.log', 'api_calls.log', 'errors.log'];
  files.forEach(file => {
    const filepath = path.join(logsDir, file);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  });
};

// Основной тест
async function testUI() {
  writeLog('ui_test.log', '🚀 Начинаем автоматизированное тестирование UI...');
  
  let browser;
  let page1, page2;
  
  try {
    // Запускаем браузер
    writeLog('ui_test.log', '📱 Запускаем браузер...');
    browser = await puppeteer.launch({ 
      headless: false, // Показываем браузер для отладки
      slowMo: 1000, // Замедляем действия для наглядности
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Создаем две страницы (как два разных пользователя)
    page1 = await browser.newPage();
    page2 = await browser.newPage();

    // Настраиваем логирование для обеих страниц
    await setupPageLogging(page1, 'Page1');
    await setupPageLogging(page2, 'Page2');

    writeLog('ui_test.log', '🌐 Открываем приложение...');
    
    // Открываем приложение на обеих страницах
    await page1.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page2.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    writeLog('ui_test.log', '✅ Приложение загружено');

    // Тест 1: Регистрация первого пользователя
    writeLog('ui_test.log', '👤 Регистрируем первого пользователя...');
    await registerUser(page1, 'testuser1@example.com', 'password123', 'Пользователь 1');
    
    // Тест 2: Регистрация второго пользователя
    writeLog('ui_test.log', '👤 Регистрируем второго пользователя...');
    await registerUser(page2, 'testuser2@example.com', 'password123', 'Пользователь 2');

    // Тест 3: Проверяем отображение пользователей
    writeLog('ui_test.log', '🔍 Проверяем отображение пользователей...');
    await checkUsersDisplay(page1, 'Page1');
    await checkUsersDisplay(page2, 'Page2');

    // Тест 4: Проверяем API вызовы
    writeLog('ui_test.log', '📡 Проверяем API вызовы...');
    await checkAPICalls(page1, 'Page1');
    await checkAPICalls(page2, 'Page2');

    // Тест 5: Проверяем localStorage
    writeLog('ui_test.log', '💾 Проверяем localStorage...');
    await checkLocalStorage(page1, 'Page1');
    await checkLocalStorage(page2, 'Page2');

    writeLog('ui_test.log', '✅ Все тесты завершены успешно!');

  } catch (error) {
    writeLog('errors.log', `❌ Ошибка в тесте: ${error.message}`);
    writeLog('errors.log', `Стек ошибки: ${error.stack}`);
  } finally {
    // Делаем скриншоты перед закрытием
    if (page1) {
      await page1.screenshot({ path: path.join(logsDir, 'page1_final.png') });
    }
    if (page2) {
      await page2.screenshot({ path: path.join(logsDir, 'page2_final.png') });
    }
    
    if (browser) {
      await browser.close();
    }
  }
}

// Настройка логирования для страницы
async function setupPageLogging(page, pageName) {
  // Логируем консоль
  page.on('console', msg => {
    writeLog('ui_test.log', `[${pageName}] Console: ${msg.text()}`);
  });

  // Логируем ошибки
  page.on('pageerror', error => {
    writeLog('errors.log', `[${pageName}] Page Error: ${error.message}`);
  });

  // Логируем сетевые запросы
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      writeLog('api_calls.log', `[${pageName}] API Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      writeLog('api_calls.log', `[${pageName}] API Response: ${response.status()} ${response.url()}`);
    }
  });
}

// Регистрация пользователя
async function registerUser(page, email, password, name) {
  try {
    // Ждем появления формы входа
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Заполняем форму
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    
    // Нажимаем кнопку входа
    await page.click('button[type="submit"]');
    
    // Ждем успешной регистрации/входа
    await page.waitForFunction(() => {
      return !document.querySelector('input[type="email"]') || 
             document.querySelector('[data-testid="user-settings"]') ||
             localStorage.getItem('currentUser');
    }, { timeout: 15000 });
    
    writeLog('ui_test.log', `✅ Пользователь ${name} зарегистрирован/вошел`);
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка регистрации ${name}: ${error.message}`);
  }
}

// Проверка отображения пользователей
async function checkUsersDisplay(page, pageName) {
  try {
    // Ждем появления правой панели
    await page.waitForSelector('[data-testid="sidebar-right"]', { timeout: 10000 });
    
    // Получаем список пользователей
    const users = await page.evaluate(() => {
      const userElements = document.querySelectorAll('[data-testid="user-item"]');
      return Array.from(userElements).map(el => ({
        name: el.querySelector('[data-testid="user-name"]')?.textContent,
        isMe: el.querySelector('[data-testid="user-me"]') !== null,
        isRealUser: el.querySelector('[data-testid="user-real"]') !== null
      }));
    });
    
    writeLog('users_panel.log', `[${pageName}] Найдено пользователей: ${users.length}`);
    users.forEach((user, index) => {
      writeLog('users_panel.log', `[${pageName}] Пользователь ${index + 1}: ${user.name} (Вы: ${user.isMe}, Реальный: ${user.isRealUser})`);
    });
    
    // Проверяем, что есть хотя бы 2 пользователя
    if (users.length >= 2) {
      writeLog('users_panel.log', `✅ [${pageName}] Многопользовательский режим работает!`);
    } else {
      writeLog('users_panel.log', `⚠️ [${pageName}] Мало пользователей: ${users.length}`);
    }
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка проверки пользователей [${pageName}]: ${error.message}`);
  }
}

// Проверка API вызовов
async function checkAPICalls(page, pageName) {
  try {
    // Ждем немного для завершения API вызовов
    await page.waitForTimeout(2000);
    
    // Получаем логи API из консоли
    const apiLogs = await page.evaluate(() => {
      return window.apiLogs || [];
    });
    
    writeLog('api_calls.log', `[${pageName}] API вызовов: ${apiLogs.length}`);
    apiLogs.forEach(log => {
      writeLog('api_calls.log', `[${pageName}] ${log}`);
    });
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка проверки API [${pageName}]: ${error.message}`);
  }
}

// Проверка localStorage
async function checkLocalStorage(page, pageName) {
  try {
    const storage = await page.evaluate(() => {
      return {
        authToken: localStorage.getItem('authToken'),
        currentUser: localStorage.getItem('currentUser'),
        hasToken: !!localStorage.getItem('authToken'),
        hasUser: !!localStorage.getItem('currentUser')
      };
    });
    
    writeLog('ui_test.log', `[${pageName}] localStorage: токен=${storage.hasToken}, пользователь=${storage.hasUser}`);
    
    if (storage.hasToken && storage.hasUser) {
      writeLog('ui_test.log', `✅ [${pageName}] JWT аутентификация работает!`);
    } else {
      writeLog('ui_test.log', `⚠️ [${pageName}] Проблемы с аутентификацией`);
    }
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка проверки localStorage [${pageName}]: ${error.message}`);
  }
}

// Запуск теста
clearLogs();
testUI().catch(error => {
  writeLog('errors.log', `❌ Критическая ошибка: ${error.message}`);
  process.exit(1);
}); 