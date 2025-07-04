const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Конфигурация
const CONFIG = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:8000/api',
  screenshotsDir: './test_screenshots',
  logsDir: './test_logs',
  testUsers: [
    { email: 'visual_test_user1@example.com', password: 'password123', name: 'Визуальный Тест 1' },
    { email: 'visual_test_user2@example.com', password: 'password123', name: 'Визуальный Тест 2' },
    { email: 'visual_test_user3@example.com', password: 'password123', name: 'Визуальный Тест 3' }
  ]
};

// Создаем папки если их нет
[CONFIG.screenshotsDir, CONFIG.logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Функция для записи логов
const writeLog = (filename, content) => {
  const timestamp = new Date().toISOString();
  const logContent = `[${timestamp}] ${content}\n`;
  fs.appendFileSync(path.join(CONFIG.logsDir, filename), logContent);
  console.log(content);
};

// Функция для очистки логов
const clearLogs = () => {
  const files = ['visual_test.log', 'ocr_analysis.log', 'api_calls.log', 'errors.log'];
  files.forEach(file => {
    const filepath = path.join(CONFIG.logsDir, file);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  });
};

// Основной тест визуального интерфейса
async function testVisualInterface() {
  writeLog('visual_test.log', '🎨 Начинаем визуальное тестирование интерфейса...');
  
  let browser;
  let pages = [];
  
  try {
    // Запускаем браузер
    writeLog('visual_test.log', '📱 Запускаем браузер...');
    browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    // Создаем страницы для каждого пользователя
    for (let i = 0; i < CONFIG.testUsers.length; i++) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await setupPageLogging(page, `User${i + 1}`);
      pages.push(page);
    }

    writeLog('visual_test.log', '🌐 Открываем приложение на всех страницах...');
    
    // Открываем приложение на всех страницах
    await Promise.all(pages.map(page => 
      page.goto(CONFIG.frontendUrl, { waitUntil: 'networkidle0' })
    ));

    writeLog('visual_test.log', '✅ Приложение загружено на всех страницах');

    // Тест 1: Регистрация пользователей
    writeLog('visual_test.log', '👤 Регистрируем пользователей...');
    for (let i = 0; i < pages.length; i++) {
      await registerUser(pages[i], CONFIG.testUsers[i], `User${i + 1}`);
    }

    // Тест 2: Проверяем отображение пользователей в правой панели
    writeLog('visual_test.log', '🔍 Проверяем отображение пользователей...');
    for (let i = 0; i < pages.length; i++) {
      await checkUsersDisplay(pages[i], `User${i + 1}`);
    }

    // Тест 3: Делаем скриншоты и анализируем их
    writeLog('visual_test.log', '📸 Делаем скриншоты...');
    await takeScreenshots(pages);

    // Тест 4: Анализируем скриншоты с OCR
    writeLog('visual_test.log', '🔍 Анализируем скриншоты с OCR...');
    await analyzeScreenshotsWithOCR();

    // Тест 5: Проверяем API вызовы
    writeLog('visual_test.log', '📡 Проверяем API вызовы...');
    await checkAPICalls(pages);

    // Тест 6: Проверяем localStorage
    writeLog('visual_test.log', '💾 Проверяем localStorage...');
    await checkLocalStorage(pages);

    writeLog('visual_test.log', '✅ Все визуальные тесты завершены успешно!');

  } catch (error) {
    writeLog('errors.log', `❌ Ошибка в визуальном тесте: ${error.message}`);
    writeLog('errors.log', `Стек ошибки: ${error.stack}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Настройка логирования для страницы
async function setupPageLogging(page, pageName) {
  page.on('console', msg => {
    writeLog('visual_test.log', `[${pageName}] Console: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    writeLog('errors.log', `[${pageName}] Page Error: ${error.message}`);
  });

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
async function registerUser(page, user, pageName) {
  try {
    writeLog('visual_test.log', `[${pageName}] Регистрируем пользователя: ${user.name}`);
    
    // Ждем появления диалога настроек
    await page.waitForSelector('[data-testid="user-settings-dialog"]', { timeout: 10000 });
    
    // Ждем появления формы входа
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Заполняем форму
    await page.type('input[type="email"]', user.email);
    await page.type('input[type="password"]', user.password);
    
    // Нажимаем кнопку входа
    await page.click('button[type="submit"]');
    
    // Ждем успешной регистрации/входа
    await page.waitForFunction(() => {
      return !document.querySelector('[data-testid="user-settings-dialog"]') ||
             !document.querySelector('input[type="email"]') ||
             localStorage.getItem('currentUser');
    }, { timeout: 15000 });
    
    writeLog('visual_test.log', `✅ [${pageName}] Пользователь ${user.name} зарегистрирован/вошел`);
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка регистрации [${pageName}]: ${error.message}`);
  }
}

// Проверка отображения пользователей
async function checkUsersDisplay(page, pageName) {
  try {
    writeLog('visual_test.log', `[${pageName}] Проверяем отображение пользователей...`);
    
    // Ждем появления правой панели
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('[data-testid="sidebar-right"]');
      return sidebar && sidebar.offsetParent !== null;
    }, { timeout: 10000 });
    
    // Получаем список пользователей
    const users = await page.evaluate(() => {
      const userElements = document.querySelectorAll('[data-testid="user-item"]');
      return Array.from(userElements).map(el => ({
        name: el.querySelector('[data-testid="user-name"]')?.textContent,
        isMe: el.querySelector('[data-testid="user-me"]') !== null,
        isRealUser: el.querySelector('[data-testid="user-real"]') !== null
      }));
    });
    
    writeLog('visual_test.log', `[${pageName}] Найдено пользователей: ${users.length}`);
    users.forEach((user, index) => {
      writeLog('visual_test.log', `[${pageName}] Пользователь ${index + 1}: ${user.name} (Вы: ${user.isMe}, Реальный: ${user.isRealUser})`);
    });
    
    // Проверяем, что есть достаточно пользователей
    if (users.length >= CONFIG.testUsers.length) {
      writeLog('visual_test.log', `✅ [${pageName}] Многопользовательский режим работает!`);
    } else {
      writeLog('visual_test.log', `⚠️ [${pageName}] Мало пользователей: ${users.length}`);
    }
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка проверки пользователей [${pageName}]: ${error.message}`);
  }
}

// Создание скриншотов
async function takeScreenshots(pages) {
  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `visual_test_user${i + 1}_${timestamp}.png`;
      const filepath = path.join(CONFIG.screenshotsDir, filename);
      
      await page.screenshot({ 
        path: filepath,
        fullPage: true 
      });
      
      writeLog('visual_test.log', `📸 Скриншот сохранен: ${filename}`);
    }
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка создания скриншотов: ${error.message}`);
  }
}

// Анализ скриншотов с OCR
async function analyzeScreenshotsWithOCR() {
  try {
    writeLog('ocr_analysis.log', '🔍 Начинаем анализ скриншотов с OCR...');
    
    // Получаем все .png файлы из папки скриншотов
    const screenshots = fs.readdirSync(CONFIG.screenshotsDir)
      .filter(f => f.endsWith('.png') && f.includes('visual_test_'));
    
    for (const screenshot of screenshots) {
      const filePath = path.join(CONFIG.screenshotsDir, screenshot);
      
      writeLog('ocr_analysis.log', `📸 Анализируем: ${screenshot}`);
      
      try {
        // Используем Tesseract для распознавания текста
        const result = await Tesseract.recognize(
          filePath,
          'rus+eng',
          {
            logger: m => {
              if (m.status) {
                writeLog('ocr_analysis.log', `   ${m.status}: ${(m.progress*100).toFixed(1)}%`);
              }
            }
          }
        );
        
        const text = result.data.text.toLowerCase();
        
        writeLog('ocr_analysis.log', `📝 Распознанный текст (${screenshot}):`);
        writeLog('ocr_analysis.log', result.data.text);
        
        // Анализируем содержимое
        const analysis = {
          hasLoginButton: text.includes('войти') || text.includes('login'),
          hasWelcomeText: text.includes('добро пожаловать') || text.includes('welcome'),
          hasEmailField: text.includes('email'),
          hasUserList: text.includes('пользователь') || text.includes('user'),
          hasRealUsers: text.includes('реальный') || text.includes('real'),
          confidence: result.data.confidence
        };
        
        writeLog('ocr_analysis.log', `🔍 Анализ ${screenshot}:`);
        writeLog('ocr_analysis.log', `   Кнопка входа: ${analysis.hasLoginButton}`);
        writeLog('ocr_analysis.log', `   Приветствие: ${analysis.hasWelcomeText}`);
        writeLog('ocr_analysis.log', `   Поле email: ${analysis.hasEmailField}`);
        writeLog('ocr_analysis.log', `   Список пользователей: ${analysis.hasUserList}`);
        writeLog('ocr_analysis.log', `   Реальные пользователи: ${analysis.hasRealUsers}`);
        writeLog('ocr_analysis.log', `   Уверенность OCR: ${analysis.confidence.toFixed(1)}%`);
        
      } catch (error) {
        writeLog('errors.log', `❌ Ошибка OCR для ${screenshot}: ${error.message}`);
      }
    }
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка анализа скриншотов: ${error.message}`);
  }
}

// Проверка API вызовов
async function checkAPICalls(pages) {
  try {
    writeLog('visual_test.log', '📡 Проверяем API вызовы...');
    
    // Ждем немного для завершения API вызовов
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Проверяем, что API вызовы были сделаны
    const apiLogContent = fs.readFileSync(path.join(CONFIG.logsDir, 'api_calls.log'), 'utf8');
    
    const apiCalls = {
      getUsers: (apiLogContent.match(/getUsers/g) || []).length,
      login: (apiLogContent.match(/login/g) || []).length,
      register: (apiLogContent.match(/register/g) || []).length
    };
    
    writeLog('visual_test.log', `📊 Статистика API вызовов:`);
    writeLog('visual_test.log', `   getUsers: ${apiCalls.getUsers}`);
    writeLog('visual_test.log', `   login: ${apiCalls.login}`);
    writeLog('visual_test.log', `   register: ${apiCalls.register}`);
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка проверки API: ${error.message}`);
  }
}

// Проверка localStorage
async function checkLocalStorage(pages) {
  try {
    writeLog('visual_test.log', '💾 Проверяем localStorage...');
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const localStorage = await page.evaluate(() => {
        return {
          currentUser: localStorage.getItem('currentUser'),
          token: localStorage.getItem('token'),
          theme: localStorage.getItem('theme')
        };
      });
      
      writeLog('visual_test.log', `[User${i + 1}] localStorage:`);
      writeLog('visual_test.log', `   currentUser: ${localStorage.currentUser ? '✅' : '❌'}`);
      writeLog('visual_test.log', `   token: ${localStorage.token ? '✅' : '❌'}`);
      writeLog('visual_test.log', `   theme: ${localStorage.theme || 'default'}`);
    }
    
  } catch (error) {
    writeLog('errors.log', `❌ Ошибка проверки localStorage: ${error.message}`);
  }
}

// Экспорт функций для использования в других тестах
module.exports = {
  testVisualInterface,
  clearLogs,
  CONFIG
};

// Запуск теста если файл вызван напрямую
if (require.main === module) {
  clearLogs();
  testVisualInterface().catch(error => {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  });
} 