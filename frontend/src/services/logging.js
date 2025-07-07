/**
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
      const response = await fetch(`${this.apiUrl}/api/client-log`, {
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
    this.info(`API Request: ${method} ${url}`, { data });
  }

  logApiResponse(method, url, status, data = null) {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    this[level](`API Response: ${method} ${url} - ${status}`, { data });
  }

  logApiError(method, url, error) {
    this.error(`API Error: ${method} ${url}`, { 
      error: error.message, 
      stack: error.stack 
    });
  }

  // Логирование пользовательских действий
  logUserAction(action, data = null) {
    this.info(`User Action: ${action}`, data);
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
    this.info(`Performance: ${metric}`, { value });
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
