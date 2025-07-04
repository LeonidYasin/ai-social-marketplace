# OCR Бот - Универсальный тестирующий модуль

## Обзор модуля

OCR Бот - это автономный модуль для визуального тестирования веб-приложений, использующий компьютерное зрение и OCR для автоматизированного тестирования пользовательских сценариев.

## Архитектура OCR Бота

### Основные компоненты
```
OCR_Bot/
├── core/
│   ├── browser_manager.js      # Управление браузером
│   ├── screenshot_manager.js   # Создание и анализ скриншотов
│   ├── ocr_engine.js          # OCR распознавание текста
│   ├── element_detector.js    # Поиск элементов на странице
│   └── action_executor.js     # Выполнение действий
├── scenarios/
│   ├── auth_scenarios.js      # Сценарии аутентификации
│   ├── post_scenarios.js      # Сценарии работы с постами
│   ├── chat_scenarios.js      # Сценарии чата
│   └── multiuser_scenarios.js # Многопользовательские сценарии
├── utils/
│   ├── image_processor.js     # Обработка изображений
│   ├── text_matcher.js        # Сопоставление текста
│   ├── coordinate_calculator.js # Расчет координат
│   └── report_generator.js    # Генерация отчетов
├── config/
│   ├── test_config.js         # Конфигурация тестов
│   ├── selectors.js           # CSS селекторы
│   └── scenarios_config.js    # Конфигурация сценариев
└── reports/
    ├── screenshots/           # Скриншоты тестов
    ├── logs/                  # Логи выполнения
    └── reports/               # Отчеты о тестировании
```

## Основные функции

### 1. Управление браузером
```javascript
class BrowserManager {
  async initBrowser(device = 'desktop') {
    // Инициализация браузера с нужными настройками
  }
  
  async navigateTo(url) {
    // Переход на страницу
  }
  
  async takeScreenshot(name) {
    // Создание скриншота
  }
  
  async closeBrowser() {
    // Закрытие браузера
  }
}
```

### 2. OCR распознавание
```javascript
class OCREngine {
  async recognizeText(imagePath) {
    // Распознавание текста на изображении
  }
  
  async findText(text, imagePath) {
    // Поиск конкретного текста
  }
  
  async getElementCoordinates(text, imagePath) {
    // Получение координат элемента по тексту
  }
}
```

### 3. Выполнение действий
```javascript
class ActionExecutor {
  async click(text) {
    // Клик по элементу с текстом
  }
  
  async type(text, inputText) {
    // Ввод текста в поле
  }
  
  async waitForElement(text, timeout = 5000) {
    // Ожидание появления элемента
  }
  
  async scrollTo(text) {
    // Прокрутка к элементу
  }
}
```

## Конфигурация тестирования

### test_config.js
```javascript
module.exports = {
  // Настройки браузера
  browser: {
    headless: false,
    slowMo: 100,
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  },
  
  // Устройства для тестирования
  devices: {
    desktop: {
      width: 1920,
      height: 1080,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    mobile: {
      width: 375,
      height: 667,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    }
  },
  
  // URL для тестирования
  urls: {
    base: 'http://localhost:3000',
    api: 'http://localhost:8000/api'
  },
  
  // Таймауты
  timeouts: {
    pageLoad: 30000,
    elementWait: 10000,
    actionDelay: 1000
  },
  
  // OCR настройки
  ocr: {
    language: 'rus+eng',
    confidence: 0.8,
    tesseractPath: './tessdata'
  }
};
```

### selectors.js
```javascript
module.exports = {
  // Элементы аутентификации
  auth: {
    googleLoginButton: 'Войти через Google',
    loginForm: 'form[data-testid="login-form"]',
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]'
  },
  
  // Элементы навигации
  navigation: {
    menuButton: 'Меню',
    searchButton: 'Поиск',
    notificationsButton: 'Уведомления',
    profileButton: 'Профиль'
  },
  
  // Элементы постов
  posts: {
    createPostButton: 'Создать пост',
    postInput: 'textarea[placeholder*="пост"]',
    publishButton: 'Опубликовать',
    likeButton: 'Нравится',
    commentButton: 'Комментировать'
  },
  
  // Элементы чата
  chat: {
    chatButton: 'Чат',
    messageInput: 'input[placeholder*="сообщение"]',
    sendButton: 'Отправить',
    onlineUsers: '.online-users'
  }
};
```

## Сценарии тестирования

### 1. Сценарий аутентификации
```javascript
class AuthScenario {
  async testGoogleOAuth(device = 'desktop') {
    const steps = [
      {
        name: 'Открытие главной страницы',
        action: () => this.browser.navigateTo(this.config.urls.base),
        expected: 'Страница загружена, кнопка "Войти через Google" видна'
      },
      {
        name: 'Клик по кнопке Google OAuth',
        action: () => this.actions.click('Войти через Google'),
        expected: 'Перенаправление на Google OAuth'
      },
      {
        name: 'Заполнение формы Google',
        action: () => this.fillGoogleForm(),
        expected: 'Успешная авторизация'
      },
      {
        name: 'Возврат на сайт',
        action: () => this.waitForElement('Профиль'),
        expected: 'Пользователь авторизован, профиль загружен'
      }
    ];
    
    return await this.executeSteps(steps);
  }
}
```

### 2. Сценарий создания поста
```javascript
class PostScenario {
  async testCreatePost(device = 'desktop') {
    const steps = [
      {
        name: 'Поиск формы создания поста',
        action: () => this.actions.waitForElement('Создать пост'),
        expected: 'Форма создания поста найдена'
      },
      {
        name: 'Ввод текста поста',
        action: () => this.actions.type('Создать пост', 'Тестовый пост от OCR бота'),
        expected: 'Текст введен в поле'
      },
      {
        name: 'Публикация поста',
        action: () => this.actions.click('Опубликовать'),
        expected: 'Пост опубликован, появился в ленте'
      },
      {
        name: 'Проверка отображения поста',
        action: () => this.actions.waitForElement('Тестовый пост от OCR бота'),
        expected: 'Пост отображается в ленте'
      }
    ];
    
    return await this.executeSteps(steps);
  }
}
```

### 3. Многопользовательский сценарий
```javascript
class MultiUserScenario {
  async testTwoUsersInteraction() {
    // Запуск двух браузеров
    const browser1 = await this.browserManager.initBrowser('desktop');
    const browser2 = await this.browserManager.initBrowser('mobile');
    
    const steps = [
      {
        name: 'Авторизация пользователя A',
        action: () => this.authUser(browser1, 'userA@gmail.com'),
        expected: 'Пользователь A авторизован'
      },
      {
        name: 'Авторизация пользователя B',
        action: () => this.authUser(browser2, 'userB@gmail.com'),
        expected: 'Пользователь B авторизован'
      },
      {
        name: 'Создание поста пользователем A',
        action: () => this.createPost(browser1, 'Пост от пользователя A'),
        expected: 'Пост создан'
      },
      {
        name: 'Проверка видимости поста для пользователя B',
        action: () => this.checkPostVisibility(browser2, 'Пост от пользователя A'),
        expected: 'Пост виден пользователю B'
      },
      {
        name: 'Реакция на пост от пользователя B',
        action: () => this.reactToPost(browser2, 'Нравится'),
        expected: 'Реакция добавлена'
      },
      {
        name: 'Проверка реакции для пользователя A',
        action: () => this.checkReaction(browser1, '1'),
        expected: 'Счетчик реакций обновлен'
      }
    ];
    
    return await this.executeSteps(steps);
  }
}
```

## Обработка ошибок и отчетность

### Класс обработки ошибок
```javascript
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.screenshots = [];
  }
  
  async handleError(error, step, screenshot) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      step: step.name,
      error: error.message,
      screenshot: screenshot,
      browserInfo: await this.getBrowserInfo(),
      pageInfo: await this.getPageInfo()
    };
    
    this.errors.push(errorInfo);
    this.screenshots.push(screenshot);
    
    console.error(`Ошибка в шаге "${step.name}":`, error.message);
  }
  
  async generateErrorReport() {
    return {
      summary: {
        totalSteps: this.totalSteps,
        failedSteps: this.errors.length,
        successRate: ((this.totalSteps - this.errors.length) / this.totalSteps * 100).toFixed(2)
      },
      errors: this.errors,
      screenshots: this.screenshots,
      recommendations: this.generateRecommendations()
    };
  }
}
```

### Генератор отчетов
```javascript
class ReportGenerator {
  async generateTestReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      testName: testResults.name,
      duration: testResults.duration,
      summary: {
        total: testResults.steps.length,
        passed: testResults.steps.filter(s => s.status === 'passed').length,
        failed: testResults.steps.filter(s => s.status === 'failed').length,
        skipped: testResults.steps.filter(s => s.status === 'skipped').length
      },
      steps: testResults.steps,
      screenshots: testResults.screenshots,
      errors: testResults.errors,
      performance: testResults.performance
    };
    
    await this.saveReport(report);
    await this.generateHTMLReport(report);
    
    return report;
  }
}
```

## Интеграция с основным проектом

### Запуск тестов
```javascript
// test_runner.js
const OCRBot = require('./ocr_bot');
const config = require('./config/test_config');

async function runAllTests() {
  const bot = new OCRBot(config);
  
  try {
    await bot.init();
    
    // Запуск всех сценариев
    const results = await Promise.all([
      bot.runAuthTests(),
      bot.runPostTests(),
      bot.runChatTests(),
      bot.runMultiUserTests()
    ]);
    
    // Генерация общего отчета
    await bot.generateMasterReport(results);
    
  } catch (error) {
    console.error('Ошибка выполнения тестов:', error);
  } finally {
    await bot.cleanup();
  }
}

module.exports = { runAllTests };
```

### Интеграция с CI/CD
```javascript
// ci_integration.js
const { runAllTests } = require('./test_runner');

// Для GitHub Actions
if (process.env.CI) {
  runAllTests()
    .then(results => {
      if (results.summary.failed > 0) {
        process.exit(1); // Тесты провалены
      }
      process.exit(0); // Тесты прошли
    })
    .catch(error => {
      console.error('Ошибка CI:', error);
      process.exit(1);
    });
}
```

## Мониторинг и метрики

### Сбор метрик
```javascript
class MetricsCollector {
  constructor() {
    this.metrics = {
      responseTimes: [],
      errorRates: [],
      successRates: [],
      performance: []
    };
  }
  
  async collectMetrics(step, startTime, endTime) {
    const duration = endTime - startTime;
    
    this.metrics.responseTimes.push({
      step: step.name,
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    // Сбор метрик производительности
    const performance = await this.getPerformanceMetrics();
    this.metrics.performance.push(performance);
  }
  
  async generateMetricsReport() {
    return {
      averageResponseTime: this.calculateAverage(this.metrics.responseTimes.map(r => r.duration)),
      errorRate: this.calculateErrorRate(),
      successRate: this.calculateSuccessRate(),
      performanceTrends: this.analyzePerformanceTrends()
    };
  }
}
```

## Конфигурация для разных окружений

### Development
```javascript
// config/development.js
module.exports = {
  ...baseConfig,
  browser: {
    ...baseConfig.browser,
    headless: false,
    slowMo: 200
  },
  urls: {
    base: 'http://localhost:3000',
    api: 'http://localhost:8000/api'
  },
  debug: true
};
```

### Production
```javascript
// config/production.js
module.exports = {
  ...baseConfig,
  browser: {
    ...baseConfig.browser,
    headless: true,
    slowMo: 50
  },
  urls: {
    base: 'https://your-production-domain.com',
    api: 'https://your-production-domain.com/api'
  },
  debug: false
};
```

## Использование

### Запуск тестов
```bash
# Установка зависимостей
npm install

# Запуск всех тестов
npm run test:ocr

# Запуск конкретного сценария
npm run test:ocr -- --scenario=auth

# Запуск с определенным устройством
npm run test:ocr -- --device=mobile

# Запуск многопользовательских тестов
npm run test:ocr -- --multiuser
```

### Просмотр отчетов
```bash
# Открыть HTML отчет
open reports/latest/report.html

# Просмотр логов
tail -f reports/logs/test.log

# Просмотр скриншотов
ls reports/screenshots/
```

Этот модуль OCR бота может быть интегрирован в основной проект как отдельный инструмент тестирования, который будет автоматически проверять все сценарии взаимодействия пользователей и генерировать подробные отчеты о найденных проблемах. 