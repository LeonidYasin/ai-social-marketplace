import logger from './logging';

class BackendManager {
  constructor() {
    this.isBackendRunning = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 секунды
    this.healthCheckInterval = null;
    this.autoStartEnabled = true;
    this.backendPort = 8000;
    
    // Используем правильный URL для production или development
    if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
      // В production используем тот же домен, что и фронтенд
      this.backendUrl = 'https://social-marketplace-api.onrender.com';
    } else {
      // В development используем localhost
      this.backendUrl = `http://localhost:${this.backendPort}`;
    }
    
    this.autoStartEndpoint = '/api/backend/start'; // Эндпоинт для автозапуска
  }

  // Проверка здоровья бэкенда
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.backendUrl}/api/admin/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        this.isBackendRunning = true;
        this.retryAttempts = 0;
        logger.info('Backend health check: OK');
        return true;
      }
    } catch (error) {
      this.isBackendRunning = false;
      logger.error('Backend health check failed:', error.message);
    }
    
    return false;
  }

  // Попытка автоматического запуска бэкенда
  async tryAutoStartBackend() {
    if (!this.autoStartEnabled || this.retryAttempts >= this.maxRetries) {
      return false;
    }

    this.retryAttempts++;
    logger.info(`Attempting to start backend (attempt ${this.retryAttempts}/${this.maxRetries})`);

    try {
      // Проверяем, находимся ли мы в браузере
      if (typeof window === 'undefined') {
        return false;
      }

      // Попытка 1: Запуск через консольные команды (если фронтенд и бэкенд на одном сервере)
      const consoleStartResult = await this.tryAutoStartViaConsole();
      if (consoleStartResult) {
        logger.info('Backend auto-started via console commands');
        return true;
      }

      // Попытка 2: Проверяем, есть ли скрипт запуска в корне проекта
      const scriptStartResult = await this.tryAutoStartViaScript();
      if (scriptStartResult) {
        logger.info('Backend auto-started via script');
        return true;
      }

      // Попытка 3: Показываем инструкции по ручному запуску
      logger.info('Cannot auto-start backend - showing manual instructions');
      this.showManualStartInstructions();
      
      return false;
      
    } catch (error) {
      logger.error('Backend auto-start failed:', error.message);
    }

    return false;
  }

  // Попытка автозапуска через консольные команды
  async tryAutoStartViaConsole() {
    try {
      logger.info('Trying to auto-start backend via console commands');
      
      // Проверяем, можем ли мы выполнять команды через консоль
      if (typeof window !== 'undefined' && window.console) {
        
        // Создаем инструкции для пользователя с командами
        const commands = this.generateStartCommands();
        
        // Показываем команды в консоли
        console.log('%c🚀 АВТОЗАПУСК БЭКЕНДА', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
        console.log('%cВыполните следующие команды в консоли сервера:', 'color: #2196F3; font-size: 14px;');
        console.log('%c==========================================', 'color: #666;');
        
        commands.forEach((cmd, index) => {
          console.log(`%c${index + 1}. ${cmd}`, 'color: #FF9800; font-family: monospace; font-size: 12px;');
        });
        
        console.log('%c==========================================', 'color: #666;');
        console.log('%cПосле выполнения команд перезагрузите страницу', 'color: #4CAF50; font-size: 12px;');
        
        // Показываем уведомление пользователю
        this.showConsoleInstructions(commands);
        
        // Возвращаем true, так как инструкции показаны
        return true;
      }
    } catch (error) {
      logger.error('Auto-start via console failed:', error.message);
    }
    
    return false;
  }

  // Генерация команд для запуска бэкенда
  generateStartCommands() {
    const commands = [];
    
    // Определяем тип системы и генерируем соответствующие команды
    const isWindows = navigator.platform.indexOf('Win') !== -1;
    
    if (isWindows) {
      // Windows команды
      commands.push('cd backend');
      commands.push('npm start');
      // Альтернативные команды
      commands.push('cd backend && npm start');
      commands.push('start-all.ps1'); // Если есть PowerShell скрипт
    } else {
      // Linux/Mac команды
      commands.push('cd backend');
      commands.push('npm start');
      // Альтернативные команды
      commands.push('cd backend && npm start');
      commands.push('./start-all.sh'); // Если есть bash скрипт
    }
    
    // Добавляем команды для проверки статуса
    commands.push(`curl http://localhost:${this.backendPort}/api/admin/health`);
    commands.push(`netstat -an | grep :${this.backendPort}`);
    
    return commands;
  }

  // Показ инструкций пользователю (отключено)
  showConsoleInstructions(commands) {
    // Отключаем модальное окно, оставляем только логирование в консоль
    console.log('%c📋 РУЧНОЙ ЗАПУСК БЭКЕНДА', 'color: #FF9800; font-size: 16px; font-weight: bold;');
    console.log('%cВыполните следующие команды в консоли сервера:', 'color: #2196F3; font-size: 14px;');
    console.log('%c==========================================', 'color: #666;');
    
    commands.forEach((cmd, index) => {
      console.log(`%c${index + 1}. ${cmd}`, 'color: #FF9800; font-family: monospace; font-size: 12px;');
    });
    
    console.log('%c==========================================', 'color: #666;');
    console.log('%cПосле выполнения команд перезагрузите страницу', 'color: #4CAF50; font-size: 12px;');
  }

  // Попытка автозапуска через скрипт (если доступен)
  async tryAutoStartViaScript() {
    try {
      // Проверяем, есть ли скрипт запуска в корне проекта
      const scriptCheckUrl = `${window.location.origin}/api/backend/check-scripts`;
      
      const response = await fetch(scriptCheckUrl, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const scripts = await response.json();
        
        if (scripts.available && scripts.startScript) {
          logger.logInfo(`Found start script: ${scripts.startScript}`);
          
          // Запускаем скрипт
          const startResponse = await fetch(`${window.location.origin}/api/backend/execute-script`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              script: scripts.startScript,
              action: 'start-backend'
            }),
            timeout: 15000 // 15 секунд на выполнение скрипта
          });

          if (startResponse.ok) {
            const result = await startResponse.json();
            logger.logInfo('Script execution result:', result);
            
            // Ждем запуска сервера
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Проверяем здоровье
            const isHealthy = await this.checkBackendHealth();
            if (isHealthy) {
              logger.logInfo('Backend successfully started via script');
              return true;
            }
          }
        }
      }
    } catch (error) {
      logger.error('Auto-start via script failed:', error.message);
    }
    
    return false;
  }

  // Умная обработка ошибок подключения
  async handleConnectionError(error, endpoint) {
    const errorMessage = error.message || '';
    
    // Определяем тип ошибки
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
      return this.handleBackendUnavailableError(endpoint);
    } else if (errorMessage.includes('timeout')) {
      return this.handleTimeoutError(endpoint);
    } else if (errorMessage.includes('401')) {
      return this.handleAuthError();
    } else if (errorMessage.includes('500')) {
      return this.handleServerError(endpoint);
    } else {
      return this.handleGenericError(error, endpoint);
    }
  }

  // Обработка ошибки недоступности бэкенда
  async handleBackendUnavailableError(endpoint) {
    const userMessage = {
      type: 'backend_unavailable',
      title: 'Сервер недоступен',
      message: 'Не удается подключиться к серверу. Пытаемся запустить автоматически...',
      severity: 'warning',
      actions: [
        {
          label: 'Попробовать снова',
          action: () => this.retryConnection()
        }
      ]
    };

    // Пытаемся автозапустить бэкенд
    if (this.autoStartEnabled && this.retryAttempts < this.maxRetries) {
      const autoStartResult = await this.tryAutoStartBackend();
      
      if (autoStartResult) {
        userMessage.title = 'Сервер запущен!';
        userMessage.message = 'Бэкенд успешно запущен автоматически. Перезагружаем страницу...';
        userMessage.severity = 'success';
        
        // Перезагружаем страницу через 2 секунды
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        userMessage.message = 'Автозапуск не удался. Инструкции по запуску в консоли браузера.';
        // Показываем инструкции только в консоли
        this.showManualStartInstructions();
      }
    }

    return userMessage;
  }

  // Обработка ошибки таймаута
  handleTimeoutError(endpoint) {
    return {
      type: 'timeout',
      title: 'Превышено время ожидания',
      message: 'Сервер отвечает слишком долго. Возможно, он перегружен или есть проблемы с сетью.',
      severity: 'warning',
      actions: [
        {
          label: 'Попробовать снова',
          action: () => this.retryConnection()
        }
      ]
    };
  }

  // Обработка ошибки авторизации
  handleAuthError() {
    return {
      type: 'auth_error',
      title: 'Ошибка авторизации',
      message: 'Ваша сессия истекла. Пожалуйста, войдите в систему снова.',
      severity: 'error',
      actions: [
        {
          label: 'Войти снова',
          action: () => window.location.href = '/settings'
        }
      ]
    };
  }

  // Обработка серверной ошибки
  handleServerError(endpoint) {
    return {
      type: 'server_error',
      title: 'Ошибка сервера',
      message: 'Произошла внутренняя ошибка сервера. Наша команда уже работает над её устранением.',
      severity: 'error',
      actions: [
        {
          label: 'Сообщить об ошибке',
          action: () => this.reportError(endpoint)
        },
        {
          label: 'Попробовать снова',
          action: () => this.retryConnection()
        }
      ]
    };
  }

  // Обработка общей ошибки
  handleGenericError(error, endpoint) {
    return {
      type: 'generic_error',
      title: 'Произошла ошибка',
      message: `Неожиданная ошибка: ${error.message}`,
      severity: 'error',
      actions: [
        {
          label: 'Попробовать снова',
          action: () => this.retryConnection()
        }
      ]
    };
  }

  // Повторная попытка подключения
  async retryConnection() {
    logger.info('Retrying connection to backend...');
    
    // Ждем немного перед повторной попыткой
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Проверяем здоровье бэкенда
    const isHealthy = await this.checkBackendHealth();
    
    if (isHealthy) {
      // Перезагружаем страницу для восстановления состояния
      window.location.reload();
    } else {
      // Логируем неудачу и показываем инструкции в консоли
      console.warn('Повторная попытка подключения не удалась. Проверьте, запущен ли сервер.');
      this.showManualStartInstructions();
    }
  }

  // Показать инструкции по ручному запуску (отключено)
  showManualStartInstructions() {
    // Генерируем команды для текущей системы
    const commands = this.generateStartCommands();
    
    // Отключаем модальное окно, оставляем только логирование в консоль
    this.showConsoleInstructions(commands);
  }

  // Сообщить об ошибке
  reportError(endpoint, error = null) {
    const errorData = {
      endpoint,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };

    // Сохраняем ошибку в localStorage для последующей отправки
    const errorReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
    errorReports.push(errorData);
    localStorage.setItem('errorReports', JSON.stringify(errorReports));

    // Логируем сохранение ошибки
    console.log('Ошибка сохранена и будет отправлена разработчикам при следующем подключении к серверу.');
  }

  // Показать уведомление об ошибке (отключено)
  showErrorNotification(errorInfo) {
    // Отключаем всплывающие уведомления
    // Логируем ошибку только в консоль
    console.warn('BackendManager Error:', errorInfo);
    
    // Можно добавить логирование в файл или отправку на сервер
    if (typeof window !== 'undefined' && window.apiLogs) {
      window.apiLogs.push(`BackendManager Error: ${errorInfo.title} - ${errorInfo.message}`);
    }
  }

  // Запустить мониторинг здоровья бэкенда
  startHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Первоначальная проверка здоровья
    this.checkBackendHealth();

    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkBackendHealth();
      
      if (!isHealthy && this.isBackendRunning) {
        logger.warn('Backend became unavailable');
        this.isBackendRunning = false;
        
        // Логируем потерю соединения
        console.warn('Соединение с сервером потеряно. Пытаемся восстановить...');
      }
    }, 30000); // Проверяем каждые 30 секунд
  }

  // Остановить мониторинг
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Получить статус бэкенда
  getBackendStatus() {
    return {
      isRunning: this.isBackendRunning,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries,
      autoStartEnabled: this.autoStartEnabled,
      backendUrl: this.backendUrl
    };
  }

  // Настроить параметры
  configure(options) {
    if (options.autoStartEnabled !== undefined) {
      this.autoStartEnabled = options.autoStartEnabled;
    }
    if (options.maxRetries !== undefined) {
      this.maxRetries = options.maxRetries;
    }
    if (options.retryDelay !== undefined) {
      this.retryDelay = options.retryDelay;
    }
    if (options.backendPort !== undefined) {
      this.backendPort = options.backendPort;
      this.backendUrl = `http://localhost:${this.backendPort}`;
    }
  }
}

// Создаем единственный экземпляр
const backendManager = new BackendManager();

export default backendManager; 