// Конфигурация логирования
module.exports = {
  // Уровни логирования
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  
  // Текущий уровень логирования
  currentLevel: process.env.LOG_LEVEL || 'INFO',
  
  // Настройки файлов логов
  files: {
    backend: 'backend.log',
    frontend: 'frontend.log',
    errors: 'errors.log',
    access: 'access.log'
  },
  
  // Максимальный размер файла лога (в МБ)
  maxFileSize: process.env.LOG_MAX_SIZE || 50,
  
  // Количество дней для хранения логов
  retentionDays: process.env.LOG_RETENTION_DAYS || 7,
  
  // Настройки для разных окружений
  environments: {
    development: {
      level: 'DEBUG',
      consoleOutput: true,
      fileOutput: true,
      colors: true
    },
    production: {
      level: 'INFO',
      consoleOutput: false,
      fileOutput: true,
      colors: false
    },
    test: {
      level: 'ERROR',
      consoleOutput: false,
      fileOutput: false,
      colors: false
    }
  },
  
  // Фильтры для исключения определенных сообщений
  filters: {
    // Исключаем избыточные сообщения
    excludePatterns: [
      /\[getUsers\] Получен запрос на список пользователей/,
      /\[getUsers\] Найдено пользователей:/,
      /Getting notifications for user/,
      /createPost: Request body:/,
      /createPost: User from token:/,
      /createPost: User ID from token:/,
      /createPost: About to execute SQL with params:/,
      /createPost: SQL executed successfully/,
      /SocketManager: Отправка уведомления для сообщения:/,
      /SocketManager: io доступен:/,
      /SocketManager: Получатель не найден для чата/,
      /SocketManager: Найден получатель с ID:/,
      /SocketManager: Онлайн пользователи:/,
      /User joining chat/,
      /Sending \d+ unread notifications to user/,
      /Sending \d+ undelivered notifications to user/,
      /User .* joined chat/,
      /postsAPI\.getPosts called/,
      /postsAPI\.getPosts result:/,
      /Fetching users from API/,
      /API response status:/,
      /API response data:/
    ],
    
    // Включаем только важные сообщения в консоль
    consoleOnlyPatterns: [
      /Server started on port/,
      /API available at:/,
      /Network access available at:/,
      /Google OAuth:/,
      /WebSocket server running on port/,
      /Backend server listening on/,
      /Backend initialization completed successfully/,
      /Environment variables loaded:/,
      /HOST:/,
      /PORT:/,
      /NODE_ENV:/
    ]
  },
  
  // Настройки форматирования
  formatting: {
    timestamp: true,
    level: true,
    colors: process.env.NODE_ENV !== 'production',
    maxDataDepth: 3,
    truncateLongStrings: 1000
  }
}; 