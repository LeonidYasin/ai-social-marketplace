const os = require('os');
const logger = require('./logger');

/**
 * Универсальный модуль для работы с кодировками
 * Автоматически определяет оптимальную кодировку для текущей системы
 */

// Детекция операционной системы
const platform = os.platform();
const isWindows = platform === 'win32';
const isLinux = platform === 'linux';
const isDarwin = platform === 'darwin'; // macOS

/**
 * Определяет оптимальную кодировку для текущей системы
 * @returns {string} Кодировка для использования
 */
function getOptimalEncoding() {
  if (isWindows) {
    // Windows - используем WIN1251 для совместимости с локальной разработкой
    return 'WIN1251';
  } else {
    // Linux/macOS/Render - используем UTF8
    return 'UTF8';
  }
}

/**
 * Получает конфигурацию кодировки для PostgreSQL
 * @returns {Object} Конфигурация кодировки
 */
function getDatabaseEncodingConfig() {
  const encoding = getOptimalEncoding();
  
  logger.info('Database encoding configuration', {
    platform,
    isWindows,
    isLinux,
    isDarwin,
    selectedEncoding: encoding,
    nodeEnv: process.env.NODE_ENV
  });

  return {
    client_encoding: encoding
  };
}

/**
 * Проверяет совместимость кодировки с текущей системой
 * @param {string} encoding - Кодировка для проверки
 * @returns {boolean} Совместима ли кодировка
 */
function isEncodingCompatible(encoding) {
  if (encoding === 'UTF8') {
    return true; // UTF8 работает везде
  } else if (encoding === 'WIN1251') {
    return isWindows; // WIN1251 только на Windows
  }
  return false;
}

/**
 * Получает рекомендуемую кодировку для production
 * @returns {string} Рекомендуемая кодировка
 */
function getProductionEncoding() {
  // В production всегда используем UTF8 для совместимости
  return 'UTF8';
}

/**
 * Создает конфигурацию БД с правильной кодировкой
 * @param {Object} baseConfig - Базовая конфигурация
 * @returns {Object} Конфигурация с кодировкой
 */
function addEncodingToConfig(baseConfig) {
  const encodingConfig = getDatabaseEncodingConfig();
  
  // В production принудительно используем UTF8
  if (process.env.NODE_ENV === 'production') {
    encodingConfig.client_encoding = getProductionEncoding();
    logger.info('Production environment detected, using UTF8 encoding');
  }
  
  return {
    ...baseConfig,
    ...encodingConfig
  };
}

/**
 * Логирует информацию о кодировках для отладки
 */
function logEncodingInfo() {
  logger.info('Encoding system information', {
    platform,
    isWindows,
    isLinux,
    isDarwin,
    optimalEncoding: getOptimalEncoding(),
    productionEncoding: getProductionEncoding(),
    nodeEnv: process.env.NODE_ENV,
    locale: process.env.LANG || process.env.LC_ALL || 'not set'
  });
}

module.exports = {
  getOptimalEncoding,
  getDatabaseEncodingConfig,
  isEncodingCompatible,
  getProductionEncoding,
  addEncodingToConfig,
  logEncodingInfo,
  // Экспортируем константы для использования в других модулях
  PLATFORMS: {
    WINDOWS: 'win32',
    LINUX: 'linux',
    DARWIN: 'darwin'
  },
  ENCODINGS: {
    UTF8: 'UTF8',
    WIN1251: 'WIN1251'
  }
}; 