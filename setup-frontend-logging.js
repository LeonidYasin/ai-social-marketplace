#!/usr/bin/env node

/**
 * Настройка автоматического логирования frontend на Render
 * Решает проблему отсутствия логов frontend в production
 */

const fs = require('fs');
const path = require('path');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

class FrontendLoggingSetup {
  constructor() {
    this.frontendDir = 'frontend/src';
    this.backendDir = 'backend/src';
    this.loggingServicePath = path.join(this.frontendDir, 'services', 'logging.js');
    this.apiServicePath = path.join(this.frontendDir, 'services', 'api.js');
    this.appJsxPath = path.join(this.frontendDir, 'App.jsx');
  }

  // Создание сервиса логирования для frontend
  createLoggingService() {
    const loggingService = `/**
 * Сервис логирования для frontend
 * Автоматически отправляет логи на backend для записи в файл
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug'
};

class FrontendLogger {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.enabled = true;
    this.queue = [];
    this.maxQueueSize = 50;
    
    // Автоматическая отправка логов при разгрузке страницы
    window.addEventListener('beforeunload', () => {
      this.flushQueue();
    });
    
    // Периодическая отправка логов
    setInterval(() => {
      this.flushQueue();
    }, 10000); // каждые 10 секунд
  }

  // Отправка лога на backend
  async sendLog(level, message, data = null) {
    if (!this.enabled) return;

    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    try {
      const response = await fetch(\`\${this.apiUrl}/api/client-log\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        console.warn('Failed to send log to backend:', response.status);
      }
    } catch (error) {
      // Не мешаем работе приложения, если логирование не работает
      console.warn('Logging service error:', error.message);
    }
  }

  // Получение ID текущего пользователя
  getCurrentUserId() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || null;
      }
    } catch (e) {
      // Игнорируем ошибки парсинга токена
    }
    return null;
  }

  // Добавление лога в очередь
  addToQueue(level, message, data) {
    this.queue.push({ level, message, data, timestamp: Date.now() });
    
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift(); // Удаляем старые логи
    }
  }

  // Отправка всех логов из очереди
  async flushQueue() {
    if (this.queue.length === 0) return;

    const logsToSend = [...this.queue];
    this.queue = [];

    for (const log of logsToSend) {
      await this.sendLog(log.level, log.message, log.data);
    }
  }

  // Методы логирования
  error(message, data = null) {
    console.error(message, data);
    this.addToQueue(LOG_LEVELS.ERROR, message, data);
    this.sendLog(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data = null) {
    console.warn(message, data);
    this.addToQueue(LOG_LEVELS.WARN, message, data);
  }

  info(message, data = null) {
    console.info(message, data);
    this.addToQueue(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data = null) {
    if (!this.isProduction) {
      console.debug(message, data);
      this.addToQueue(LOG_LEVELS.DEBUG, message, data);
    }
  }

  // Логирование API запросов
  logApiRequest(method, url, data = null) {
    this.info(\`API Request: \${method} \${url}\`, { data });
  }

  logApiResponse(method, url, status, data = null) {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    this[level](\`API Response: \${method} \${url} - \${status}\`, { data });
  }

  logApiError(method, url, error) {
    this.error(\`API Error: \${method} \${url}\`, { 
      error: error.message, 
      stack: error.stack 
    });
  }

  // Логирование пользовательских действий
  logUserAction(action, data = null) {
    this.info(\`User Action: \${action}\`, data);
  }

  // Логирование ошибок React
  logReactError(error, errorInfo) {
    this.error('React Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    });
  }

  // Логирование производительности
  logPerformance(metric, value) {
    this.info(\`Performance: \${metric}\`, { value });
  }

  // Включение/выключение логирования
  enable() {
    this.enabled = true;
    this.info('Frontend logging enabled');
  }

  disable() {
    this.enabled = false;
    this.info('Frontend logging disabled');
  }
}

// Создаем глобальный экземпляр логгера
const logger = new FrontendLogger();

// Экспортируем для использования в компонентах
export default logger;

// Глобальный обработчик ошибок
window.addEventListener('error', (event) => {
  logger.error('Global Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack
  });
});

// Обработчик необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

// Логирование загрузки страницы
logger.info('Frontend application loaded', {
  url: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
});
`;

    try {
      fs.writeFileSync(this.loggingServicePath, loggingService);
      console.log(colorize('✅ Сервис логирования создан', 'green'));
      return true;
    } catch (error) {
      console.error(colorize(`❌ Ошибка создания сервиса логирования: ${error.message}`, 'red'));
      return false;
    }
  }

  // Обновление API сервиса для интеграции логирования
  updateApiService() {
    try {
      const apiServicePath = this.apiServicePath;
      
      if (!fs.existsSync(apiServicePath)) {
        console.log(colorize('⚠️ API сервис не найден, пропускаем обновление', 'yellow'));
        return true;
      }

      let content = fs.readFileSync(apiServicePath, 'utf8');
      
      // Добавляем импорт логгера
      if (!content.includes('import logger')) {
        const importStatement = "import logger from './logging';\n";
        content = importStatement + content;
      }

      // Добавляем логирование в API запросы
      if (!content.includes('logger.logApiRequest')) {
        // Находим функцию makeRequest и добавляем логирование
        const requestLogging = `
  // Логируем запрос
  logger.logApiRequest(method, url, data);
`;
        
        content = content.replace(
          /const response = await fetch\(url, options\);/g,
          `${requestLogging}  const response = await fetch(url, options);`
        );
      }

      // Добавляем логирование ответов
      if (!content.includes('logger.logApiResponse')) {
        const responseLogging = `
    // Логируем ответ
    logger.logApiResponse(method, url, response.status, responseData);
`;
        
        content = content.replace(
          /return responseData;/g,
          `${responseLogging}    return responseData;`
        );
      }

      // Добавляем логирование ошибок
      if (!content.includes('logger.logApiError')) {
        const errorLogging = `
    // Логируем ошибку
    logger.logApiError(method, url, error);
`;
        
        content = content.replace(
          /throw error;/g,
          `${errorLogging}    throw error;`
        );
      }

      fs.writeFileSync(apiServicePath, content);
      console.log(colorize('✅ API сервис обновлен с логированием', 'green'));
      return true;
    } catch (error) {
      console.error(colorize(`❌ Ошибка обновления API сервиса: ${error.message}`, 'red'));
      return false;
    }
  }

  // Обновление App.jsx для интеграции логирования
  updateAppJsx() {
    try {
      const appJsxPath = this.appJsxPath;
      
      if (!fs.existsSync(appJsxPath)) {
        console.log(colorize('⚠️ App.jsx не найден, пропускаем обновление', 'yellow'));
        return true;
      }

      let content = fs.readFileSync(appJsxPath, 'utf8');
      
      // Добавляем импорт логгера
      if (!content.includes('import logger')) {
        const importStatement = "import logger from './services/logging';\n";
        content = importStatement + content;
      }

      // Добавляем обработчик ошибок React
      if (!content.includes('componentDidCatch')) {
        const errorBoundary = `
  componentDidCatch(error, errorInfo) {
    logger.logReactError(error, errorInfo);
  }
`;
        
        // Находим класс App и добавляем метод
        content = content.replace(
          /class App extends Component {/g,
          `class App extends Component {${errorBoundary}`
        );
      }

      // Добавляем логирование жизненного цикла
      if (!content.includes('componentDidMount')) {
        const lifecycleLogging = `
  componentDidMount() {
    logger.info('App component mounted');
  }

  componentWillUnmount() {
    logger.info('App component will unmount');
  }
`;
        
        content = content.replace(
          /class App extends Component {/g,
          `class App extends Component {${lifecycleLogging}`
        );
      }

      fs.writeFileSync(appJsxPath, content);
      console.log(colorize('✅ App.jsx обновлен с логированием', 'green'));
      return true;
    } catch (error) {
      console.error(colorize(`❌ Ошибка обновления App.jsx: ${error.message}`, 'red'));
      return false;
    }
  }

  // Создание компонента для тестирования логирования
  createLoggingTestComponent() {
    const testComponentPath = path.join(this.frontendDir, 'components', 'LoggingTest.jsx');
    
    const testComponent = `import React from 'react';
import logger from '../services/logging';

const LoggingTest = () => {
  const testLogging = () => {
    logger.info('Test info message', { test: true, timestamp: Date.now() });
    logger.warn('Test warning message', { test: true, timestamp: Date.now() });
    logger.error('Test error message', { test: true, timestamp: Date.now() });
    logger.debug('Test debug message', { test: true, timestamp: Date.now() });
    
    // Тестируем логирование пользовательских действий
    logger.logUserAction('test_button_clicked', { buttonId: 'test-btn' });
    
    // Тестируем логирование производительности
    logger.logPerformance('test_metric', 123.45);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Frontend Logging Test</h3>
      <button onClick={testLogging} style={{ padding: '10px 20px' }}>
        Test Logging
      </button>
      <p>Click the button to test frontend logging functionality</p>
    </div>
  );
};

export default LoggingTest;
`;

    try {
      fs.writeFileSync(testComponentPath, testComponent);
      console.log(colorize('✅ Компонент тестирования логирования создан', 'green'));
      return true;
    } catch (error) {
      console.error(colorize(`❌ Ошибка создания тестового компонента: ${error.message}`, 'red'));
      return false;
    }
  }

  // Создание инструкции по интеграции
  createIntegrationGuide() {
    const guidePath = 'FRONTEND_LOGGING_SETUP.md';
    
    const guide = `# Настройка логирования Frontend на Render

## Обзор

Этот документ описывает настройку автоматического логирования frontend для отправки логов на backend и их записи в файл на Render.

## Что было настроено

### 1. Сервис логирования (\`frontend/src/services/logging.js\`)
- Автоматическая отправка логов на backend
- Очередь логов для надежной доставки
- Логирование API запросов/ответов
- Логирование пользовательских действий
- Логирование ошибок React
- Логирование производительности

### 2. Интеграция с API сервисом
- Логирование всех API запросов
- Логирование ответов и ошибок
- Автоматическое отслеживание статусов

### 3. Интеграция с App.jsx
- Обработчик ошибок React
- Логирование жизненного цикла компонентов

### 4. Тестовый компонент
- Компонент для тестирования логирования
- Проверка всех уровней логирования

## Как использовать

### 1. Импорт логгера в компонентах
\`\`\`jsx
import logger from '../services/logging';

// В компоненте
logger.info('Component loaded');
logger.logUserAction('button_clicked', { buttonId: 'submit' });
\`\`\`

### 2. Логирование ошибок
\`\`\`jsx
try {
  // код
} catch (error) {
  logger.error('Operation failed', { error: error.message });
}
\`\`\`

### 3. Логирование производительности
\`\`\`jsx
const startTime = performance.now();
// операция
const duration = performance.now() - startTime;
logger.logPerformance('operation_duration', duration);
\`\`\`

## Уровни логирования

- \`logger.error()\` - Критические ошибки
- \`logger.warn()\` - Предупреждения
- \`logger.info()\` - Информационные сообщения
- \`logger.debug()\` - Отладочная информация (только в development)

## Автоматические логи

Система автоматически логирует:
- Загрузку приложения
- API запросы и ответы
- Глобальные ошибки JavaScript
- Необработанные промисы
- Жизненный цикл компонентов

## Проверка работы

1. Откройте приложение в браузере
2. Откройте DevTools Console
3. Найдите компонент LoggingTest
4. Нажмите кнопку "Test Logging"
5. Проверьте логи в backend: \`backend/logs/frontend.log\`

## Мониторинг на Render

Логи frontend теперь будут доступны через API:
- \`GET /api/logs/frontend\` - логи frontend
- \`GET /api/logs/all\` - все логи
- \`GET /api/logs/stats\` - статистика

## Устранение неполадок

### Логи не отправляются
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что backend доступен
3. Проверьте CORS настройки

### Логи не записываются в файл
1. Проверьте права доступа к папке logs
2. Проверьте backend логи на ошибки
3. Убедитесь, что эндпоинт /api/client-log работает

## Производительность

- Логи отправляются асинхронно
- Используется очередь для надежности
- Автоматическая очистка старых логов
- Логирование отключено в production для debug уровня
`;

    try {
      fs.writeFileSync(guidePath, guide);
      console.log(colorize('✅ Инструкция по интеграции создана', 'green'));
      return true;
    } catch (error) {
      console.error(colorize(`❌ Ошибка создания инструкции: ${error.message}`, 'red'));
      return false;
    }
  }

  // Основная функция настройки
  async setup() {
    console.log(colorize('🚀 Настройка логирования frontend для Render', 'green'));
    
    const steps = [
      { name: 'Создание сервиса логирования', fn: () => this.createLoggingService() },
      { name: 'Обновление API сервиса', fn: () => this.updateApiService() },
      { name: 'Обновление App.jsx', fn: () => this.updateAppJsx() },
      { name: 'Создание тестового компонента', fn: () => this.createLoggingTestComponent() },
      { name: 'Создание инструкции', fn: () => this.createIntegrationGuide() }
    ];

    let successCount = 0;
    
    for (const step of steps) {
      console.log(colorize(`\n📋 ${step.name}...`, 'cyan'));
      const success = step.fn();
      if (success) {
        successCount++;
      }
    }

    console.log(colorize(`\n✅ Настройка завершена: ${successCount}/${steps.length} шагов выполнено`, 'green'));
    
    if (successCount === steps.length) {
      console.log(colorize('\n🎉 Логирование frontend полностью настроено!', 'green'));
      console.log(colorize('📖 См. FRONTEND_LOGGING_SETUP.md для подробностей', 'cyan'));
    } else {
      console.log(colorize('\n⚠️ Некоторые шаги не выполнены. Проверьте ошибки выше.', 'yellow'));
    }
  }
}

// Запуск настройки
if (require.main === module) {
  const setup = new FrontendLoggingSetup();
  setup.setup().catch(error => {
    console.error(colorize(`❌ Критическая ошибка: ${error.message}`, 'red'));
    process.exit(1);
  });
}

module.exports = FrontendLoggingSetup; 