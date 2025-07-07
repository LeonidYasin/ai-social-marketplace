#!/usr/bin/env node

/**
 * Автоматический скрипт для получения логов с Render.com
 * Включает получение системных логов Render и приложения
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Конфигурация
const RENDER_API_URL = 'https://social-marketplace-api.onrender.com';
const RENDER_FRONTEND_URL = 'https://social-marketplace-frontend.onrender.com';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Функция для HTTP запросов с таймаутом
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Render-Logs-Collector/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: { raw: data }
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Функция для получения логов приложения
async function getAppLogs(type = 'all', params = {}) {
  try {
    console.log(colorize(`🔍 Получение логов приложения: ${type}`, 'cyan'));
    
    const queryParams = new URLSearchParams(params).toString();
    const url = `${RENDER_API_URL}/api/logs/${type}${queryParams ? '?' + queryParams : ''}`;
    
    console.log(colorize(`📡 Запрос: ${url}`, 'gray'));
    
    const response = await makeRequest(url, { timeout: 15000 });
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.data.message || 'Unknown error'}`);
    }
    
    return response.data;
    
  } catch (error) {
    console.error(colorize(`❌ Ошибка при получении логов приложения: ${error.message}`, 'red'));
    return null;
  }
}

// Функция для проверки доступности сервисов
async function checkServiceHealth() {
  console.log(colorize('\n🏥 Проверка здоровья сервисов...', 'cyan'));
  
  const services = [
    { name: 'Backend API', url: `${RENDER_API_URL}/api/health` },
    { name: 'Frontend', url: RENDER_FRONTEND_URL }
  ];
  
  for (const service of services) {
    try {
      const response = await makeRequest(service.url, { timeout: 5000 });
      const status = response.status === 200 ? '✅' : '⚠️';
      console.log(`${status} ${service.name}: HTTP ${response.status}`);
    } catch (error) {
      console.log(colorize(`❌ ${service.name}: ${error.message}`, 'red'));
    }
  }
}

// Функция для получения системной информации
async function getSystemInfo() {
  console.log(colorize('\n💻 Системная информация:', 'cyan'));
  
  try {
    const response = await makeRequest(`${RENDER_API_URL}/api/health`, { timeout: 5000 });
    if (response.status === 200 && response.data) {
      console.log(`Backend Version: ${response.data.version || 'Unknown'}`);
      console.log(`Environment: ${response.data.environment || 'Unknown'}`);
      console.log(`Database: ${response.data.database || 'Unknown'}`);
    }
  } catch (error) {
    console.log(colorize(`❌ Не удалось получить системную информацию: ${error.message}`, 'red'));
  }
}

// Функция для сохранения логов в файл
function saveLogsToFile(logsData, type, params = {}) {
  if (!logsData || !logsData.success) {
    console.log(colorize('❌ Нет данных для сохранения', 'red'));
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const paramsStr = Object.keys(params).length > 0 ? `-${Object.keys(params).join('-')}` : '';
  const filename = `render-logs-${type}${paramsStr}-${timestamp}.json`;
  const filepath = path.join('logs', filename);
  
  // Создаем папку logs если её нет
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(logsData, null, 2));
    console.log(colorize(`💾 Логи сохранены: ${filepath}`, 'green'));
  } catch (error) {
    console.error(colorize(`❌ Ошибка сохранения: ${error.message}`, 'red'));
  }
}

// Функция для вывода логов
function displayLogs(logsData, type) {
  if (!logsData || !logsData.success) {
    console.log(colorize(`❌ Не удалось получить логи: ${logsData?.message || 'Unknown error'}`, 'red'));
    return;
  }
  
  if (type === 'stats') {
    displayStats(logsData.stats);
    return;
  }
  
  const logs = logsData.logs || [];
  const count = logsData.count || 0;
  
  console.log(colorize(`\n📊 Найдено записей: ${count}`, 'green'));
  
  if (logs.length === 0) {
    console.log(colorize('📭 Логи не найдены', 'yellow'));
    return;
  }
  
  console.log(colorize('\n📋 Последние логи:', 'cyan'));
  console.log('='.repeat(80));
  
  // Показываем только последние 10 записей
  const recentLogs = logs.slice(-10);
  
  recentLogs.forEach((log, index) => {
    const timestamp = new Date(log.timestamp).toLocaleString('ru-RU');
    const level = log.level?.toUpperCase() || 'INFO';
    const source = log.source || 'unknown';
    const message = log.message || 'No message';
    
    // Цвет для уровня логирования
    let levelColor = 'white';
    switch (level.toLowerCase()) {
      case 'error': levelColor = 'red'; break;
      case 'warning': levelColor = 'yellow'; break;
      case 'info': levelColor = 'blue'; break;
      case 'debug': levelColor = 'magenta'; break;
    }
    
    console.log(colorize(`[${timestamp}] [${level}] [${source}] ${message}`, levelColor));
    
    // Выводим дополнительные данные, если есть
    if (log.data && Object.keys(log.data).length > 0) {
      console.log(colorize(`  📄 Data: ${JSON.stringify(log.data, null, 2)}`, 'gray'));
    }
    
    // Разделитель между записями
    if (index < recentLogs.length - 1) {
      console.log('-'.repeat(40));
    }
  });
  
  console.log('='.repeat(80));
}

// Функция для вывода статистики
function displayStats(stats) {
  console.log(colorize('\n📊 Статистика логов:', 'cyan'));
  console.log('='.repeat(50));
  
  console.log(colorize('🔧 Backend:', 'blue'));
  console.log(`  Всего: ${stats.backend.total}`);
  console.log(`  Ошибки: ${colorize(stats.backend.errors, 'red')}`);
  console.log(`  Предупреждения: ${colorize(stats.backend.warnings, 'yellow')}`);
  console.log(`  Информация: ${colorize(stats.backend.info, 'green')}`);
  
  console.log(colorize('\n🎨 Frontend:', 'blue'));
  console.log(`  Всего: ${stats.frontend.total}`);
  console.log(`  Ошибки: ${colorize(stats.frontend.errors, 'red')}`);
  console.log(`  Предупреждения: ${colorize(stats.frontend.warnings, 'yellow')}`);
  console.log(`  Информация: ${colorize(stats.frontend.info, 'green')}`);
  
  console.log(colorize('\n📈 Общая статистика:', 'blue'));
  console.log(`  Всего записей: ${colorize(stats.total, 'cyan')}`);
  
  console.log('='.repeat(50));
}

// Основная функция
async function main() {
  console.log(colorize('🚀 Автоматический сбор логов с Render.com', 'green'));
  console.log(colorize(`📍 Backend API: ${RENDER_API_URL}`, 'gray'));
  console.log(colorize(`📍 Frontend: ${RENDER_FRONTEND_URL}`, 'gray'));
  
  // Проверяем здоровье сервисов
  await checkServiceHealth();
  
  // Получаем системную информацию
  await getSystemInfo();
  
  // Получаем статистику
  console.log(colorize('\n📈 Получение статистики логов...', 'cyan'));
  const statsData = await getAppLogs('stats');
  if (statsData) {
    displayStats(statsData.stats);
    saveLogsToFile(statsData, 'stats');
  }
  
  // Получаем все логи
  console.log(colorize('\n📋 Получение всех логов...', 'cyan'));
  const allLogsData = await getAppLogs('all', { limit: 100 });
  if (allLogsData) {
    displayLogs(allLogsData, 'all');
    saveLogsToFile(allLogsData, 'all');
  }
  
  // Получаем логи backend
  console.log(colorize('\n🔧 Получение логов backend...', 'cyan'));
  const backendLogsData = await getAppLogs('backend', { limit: 50 });
  if (backendLogsData) {
    displayLogs(backendLogsData, 'backend');
    saveLogsToFile(backendLogsData, 'backend');
  }
  
  // Получаем логи frontend
  console.log(colorize('\n🎨 Получение логов frontend...', 'cyan'));
  const frontendLogsData = await getAppLogs('frontend', { limit: 50 });
  if (frontendLogsData) {
    displayLogs(frontendLogsData, 'frontend');
    saveLogsToFile(frontendLogsData, 'frontend');
  }
  
  console.log(colorize('\n✅ Сбор логов завершен!', 'green'));
  console.log(colorize('📁 Все логи сохранены в папку logs/', 'cyan'));
}

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error(colorize('❌ Необработанная ошибка:', 'red'));
  console.error(reason);
});

// Запуск
if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`❌ Критическая ошибка: ${error.message}`, 'red'));
    process.exit(1);
  });
}

module.exports = {
  getAppLogs,
  checkServiceHealth,
  getSystemInfo,
  saveLogsToFile
}; 