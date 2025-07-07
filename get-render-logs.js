#!/usr/bin/env node

/**
 * Скрипт для получения логов с Render.com
 * Использование: node get-render-logs.js [тип] [параметры]
 * 
 * Примеры:
 * node get-render-logs.js backend --limit 50
 * node get-render-logs.js frontend --level error
 * node get-render-logs.js all --search "CORS"
 * node get-render-logs.js stats
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Конфигурация
const RENDER_API_URL = 'https://social-marketplace-api.onrender.com';
const LOG_TYPES = ['backend', 'frontend', 'all', 'stats'];

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Функция для HTTP запросов
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Функция для получения логов
async function getLogs(type = 'all', params = {}) {
  try {
    console.log(colorize(`🔍 Получение логов типа: ${type}`, 'cyan'));
    
    const queryParams = new URLSearchParams(params).toString();
    const url = `${RENDER_API_URL}/api/logs/${type}${queryParams ? '?' + queryParams : ''}`;
    
    console.log(colorize(`📡 Запрос: ${url}`, 'gray'));
    
    const response = await makeRequest(url);
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.data.message || 'Unknown error'}`);
    }
    
    return response.data;
    
  } catch (error) {
    console.error(colorize(`❌ Ошибка при получении логов: ${error.message}`, 'red'));
    return null;
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
  
  console.log(colorize('\n📋 Логи:', 'cyan'));
  console.log('='.repeat(80));
  
  logs.forEach((log, index) => {
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
    if (index < logs.length - 1) {
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

// Функция для сохранения логов в файл
function saveLogsToFile(logsData, type, params = {}) {
  if (!logsData || !logsData.success) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `render-logs-${type}-${timestamp}.json`;
  const filepath = path.join(__dirname, 'logs', filename);
  
  // Создаем папку logs, если её нет
  if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'));
  }
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(logsData, null, 2), 'utf8');
    console.log(colorize(`💾 Логи сохранены в файл: ${filename}`, 'green'));
  } catch (error) {
    console.error(colorize(`❌ Ошибка при сохранении файла: ${error.message}`, 'red'));
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'all';
  
  if (!LOG_TYPES.includes(type)) {
    console.log(colorize('❌ Неверный тип логов. Доступные типы:', 'red'));
    LOG_TYPES.forEach(t => console.log(colorize(`  - ${t}`, 'cyan')));
    console.log(colorize('\nПримеры использования:', 'yellow'));
    console.log('  node get-render-logs.js backend --limit 50');
    console.log('  node get-render-logs.js frontend --level error');
    console.log('  node get-render-logs.js all --search "CORS"');
    console.log('  node get-render-logs.js stats');
    return;
  }
  
  // Парсим параметры
  const params = {};
  for (let i = 1; i < args.length; i += 2) {
    if (args[i].startsWith('--') && args[i + 1]) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      params[key] = value;
    }
  }
  
  console.log(colorize('🚀 Запуск получения логов с Render.com', 'green'));
  console.log(colorize(`📍 API URL: ${RENDER_API_URL}`, 'gray'));
  
  const logsData = await getLogs(type, params);
  displayLogs(logsData, type);
  
  // Сохраняем логи в файл
  saveLogsToFile(logsData, type, params);
}

// Запуск скрипта
if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`💥 Критическая ошибка: ${error.message}`, 'red'));
    process.exit(1);
  });
}

module.exports = { getLogs, displayLogs, displayStats }; 