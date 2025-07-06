const fs = require('fs');
const path = require('path');
const config = require('../../config/logging');

// Уровни логирования
const LOG_LEVELS = config.levels;

// Текущий уровень логирования
const CURRENT_LOG_LEVEL = config.currentLevel;
const LOG_LEVEL_NUM = LOG_LEVELS[CURRENT_LOG_LEVEL] || LOG_LEVELS.INFO;

// Получаем настройки для текущего окружения
const envConfig = config.environments[process.env.NODE_ENV || 'development'];

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Функция для проверки фильтров
const shouldExclude = (message) => {
  return config.filters.excludePatterns.some(pattern => pattern.test(message));
};

const shouldShowInConsole = (message) => {
  return config.filters.consoleOnlyPatterns.some(pattern => pattern.test(message));
};

// Функция для получения временной метки
const getTimestamp = () => {
  return new Date().toISOString();
};

// Функция для записи в файл
const writeToFile = (level, message, data = null) => {
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, 'backend.log');
  const timestamp = getTimestamp();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  
  let fullLogEntry = logEntry;
  if (data) {
    try {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      fullLogEntry += `\n${dataStr}`;
    } catch (error) {
      fullLogEntry += `\n[Data serialization error: ${error.message}]`;
    }
  }
  
  fs.appendFileSync(logFile, fullLogEntry + '\n', 'utf8');
};

// Функция для вывода в консоль с цветами
const writeToConsole = (level, message, data = null, useColors = true) => {
  // Проверяем, нужно ли показывать в консоли
  if (!envConfig.consoleOutput && !shouldShowInConsole(message)) {
    return;
  }
  
  const timestamp = getTimestamp();
  let color = colors.reset;
  
  switch (level) {
    case 'ERROR':
      color = colors.red;
      break;
    case 'WARN':
      color = colors.yellow;
      break;
    case 'INFO':
      color = colors.green;
      break;
    case 'DEBUG':
      color = colors.blue;
      break;
  }
  
  const useConsoleColors = envConfig.colors && useColors;
  const prefix = useConsoleColors ? `${color}[${timestamp}] [${level}]${colors.reset}` : `[${timestamp}] [${level}]`;
  console.log(`${prefix} ${message}`);
  
  if (data) {
    try {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, config.formatting.maxDataDepth) : String(data);
      console.log(useConsoleColors ? `${color}${dataStr}${colors.reset}` : dataStr);
    } catch (error) {
      console.log(useConsoleColors ? `${color}[Data serialization error: ${error.message}]${colors.reset}` : `[Data serialization error: ${error.message}]`);
    }
  }
};

// Основные функции логирования
const logger = {
  error: (message, data = null) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.ERROR) {
      writeToFile('ERROR', message, data);
      writeToConsole('ERROR', message, data);
    }
  },
  
  warn: (message, data = null) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.WARN) {
      writeToFile('WARN', message, data);
      writeToConsole('WARN', message, data);
    }
  },
  
  info: (message, data = null) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.INFO) {
      // Проверяем фильтры
      if (shouldExclude(message)) {
        return;
      }
      writeToFile('INFO', message, data);
      // INFO сообщения только в файл, не в консоль (кроме startup)
    }
  },
  
  debug: (message, data = null) => {
    if (LOG_LEVEL_NUM >= LOG_LEVELS.DEBUG) {
      // Проверяем фильтры
      if (shouldExclude(message)) {
        return;
      }
      writeToFile('DEBUG', message, data);
      // DEBUG сообщения только в файл, не в консоль
    }
  },
  
  // Специальная функция для важных сообщений, которые должны быть в консоли
  startup: (message, data = null) => {
    writeToFile('INFO', message, data);
    // Startup сообщения ВСЕГДА выводятся в консоль
    const timestamp = getTimestamp();
    console.log(`[${timestamp}] [INFO] ${message}`);
    if (data) {
      try {
        const dataStr = typeof data === 'object' ? JSON.stringify(data, null, config.formatting.maxDataDepth) : String(data);
        console.log(dataStr);
      } catch (error) {
        console.log(`[Data serialization error: ${error.message}]`);
      }
    }
  },
  
  // Функция для критических ошибок
  critical: (message, data = null) => {
    writeToFile('ERROR', message, data);
    writeToConsole('ERROR', message, data);
  }
};

module.exports = logger; 