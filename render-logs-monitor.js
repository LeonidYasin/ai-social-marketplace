#!/usr/bin/env node

/**
 * Комплексный мониторинг логов Render.com
 * Включает автоматическое получение логов, алерты и системную информацию
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Конфигурация
const CONFIG = {
  RENDER_API_URL: 'https://social-marketplace-api.onrender.com',
  RENDER_FRONTEND_URL: 'https://social-marketplace-frontend.onrender.com',
  LOGS_DIR: 'logs',
  CHECK_INTERVAL: 5 * 60 * 1000, // 5 минут
  ALERT_LEVELS: ['error', 'critical'],
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  RETENTION_DAYS: 7
};

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

// Класс для мониторинга логов
class RenderLogsMonitor {
  constructor() {
    this.lastCheck = null;
    this.errorCount = 0;
    this.alertHistory = [];
    this.isRunning = false;
  }

  // HTTP запрос с улучшенной обработкой ошибок
  async makeRequest(url, options = {}) {
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
          'User-Agent': 'Render-Logs-Monitor/2.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 15000
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

  // Получение логов приложения
  async getAppLogs(type = 'all', params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${CONFIG.RENDER_API_URL}/api/logs/${type}${queryParams ? '?' + queryParams : ''}`;
      
      const response = await this.makeRequest(url, { timeout: 20000 });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.data.message || 'Unknown error'}`);
      }
      
      return response.data;
      
    } catch (error) {
      console.error(colorize(`❌ Ошибка получения логов ${type}: ${error.message}`, 'red'));
      return null;
    }
  }

  // Проверка здоровья сервисов
  async checkServiceHealth() {
    const services = [
      { name: 'Backend API', url: `${CONFIG.RENDER_API_URL}/api/health` },
      { name: 'Frontend', url: CONFIG.RENDER_FRONTEND_URL }
    ];
    
    const results = [];
    
    for (const service of services) {
      try {
        const response = await this.makeRequest(service.url, { timeout: 10000 });
        const isHealthy = response.status === 200;
        results.push({
          name: service.name,
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime: Date.now(),
          httpStatus: response.status
        });
        
        console.log(`${isHealthy ? '✅' : '❌'} ${service.name}: HTTP ${response.status}`);
      } catch (error) {
        results.push({
          name: service.name,
          status: 'error',
          error: error.message,
          responseTime: Date.now()
        });
        console.log(colorize(`❌ ${service.name}: ${error.message}`, 'red'));
      }
    }
    
    return results;
  }

  // Анализ логов на наличие ошибок
  analyzeLogsForErrors(logsData) {
    if (!logsData || !logsData.success || !logsData.logs) {
      return [];
    }

    const errors = [];
    const logs = logsData.logs;

    logs.forEach(log => {
      const level = log.level?.toLowerCase();
      const message = log.message?.toLowerCase() || '';
      
      // Проверяем на критические ошибки
      if (level === 'error' || level === 'critical') {
        errors.push({
          timestamp: log.timestamp,
          level: log.level,
          source: log.source || 'unknown',
          message: log.message,
          data: log.data
        });
      }
      
      // Проверяем на ключевые слова ошибок
      const errorKeywords = ['error', 'failed', 'exception', 'crash', 'timeout', 'connection refused'];
      if (errorKeywords.some(keyword => message.includes(keyword))) {
        errors.push({
          timestamp: log.timestamp,
          level: 'warning',
          source: log.source || 'unknown',
          message: log.message,
          data: log.data,
          keyword: errorKeywords.find(keyword => message.includes(keyword))
        });
      }
    });

    return errors;
  }

  // Создание алертов
  createAlerts(errors) {
    const alerts = [];
    
    errors.forEach(error => {
      const alert = {
        id: `${error.timestamp}-${error.source}-${error.level}`,
        timestamp: new Date().toISOString(),
        type: error.level === 'error' ? 'critical' : 'warning',
        source: error.source,
        message: error.message,
        data: error.data,
        severity: error.level === 'error' ? 'high' : 'medium'
      };
      
      alerts.push(alert);
    });
    
    return alerts;
  }

  // Сохранение логов в файл
  saveLogsToFile(logsData, type, params = {}) {
    if (!logsData || !logsData.success) {
      return null;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const paramsStr = Object.keys(params).length > 0 ? `-${Object.keys(params).join('-')}` : '';
    const filename = `render-logs-${type}${paramsStr}-${timestamp}.json`;
    const filepath = path.join(CONFIG.LOGS_DIR, filename);
    
    // Создаем папку logs если её нет
    if (!fs.existsSync(CONFIG.LOGS_DIR)) {
      fs.mkdirSync(CONFIG.LOGS_DIR);
    }
    
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: type,
        params: params,
        data: logsData,
        monitorVersion: '2.0'
      };
      
      fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2));
      return filepath;
    } catch (error) {
      console.error(colorize(`❌ Ошибка сохранения: ${error.message}`, 'red'));
      return null;
    }
  }

  // Очистка старых логов
  cleanupOldLogs() {
    try {
      if (!fs.existsSync(CONFIG.LOGS_DIR)) {
        return;
      }
      
      const files = fs.readdirSync(CONFIG.LOGS_DIR);
      const cutoffDate = new Date(Date.now() - CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filepath = path.join(CONFIG.LOGS_DIR, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        console.log(colorize(`🗑️ Удалено ${deletedCount} старых файлов логов`, 'yellow'));
      }
    } catch (error) {
      console.error(colorize(`❌ Ошибка очистки логов: ${error.message}`, 'red'));
    }
  }

  // Вывод статистики
  displayStats(stats) {
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

  // Вывод алертов
  displayAlerts(alerts) {
    if (alerts.length === 0) {
      console.log(colorize('✅ Алертов не найдено', 'green'));
      return;
    }
    
    console.log(colorize(`\n🚨 Найдено ${alerts.length} алертов:`, 'red'));
    console.log('='.repeat(80));
    
    alerts.forEach((alert, index) => {
      const timestamp = new Date(alert.timestamp).toLocaleString('ru-RU');
      const severityColor = alert.severity === 'high' ? 'red' : 'yellow';
      
      console.log(colorize(`[${timestamp}] [${alert.type.toUpperCase()}] [${alert.source}] ${alert.message}`, severityColor));
      
      if (alert.data && Object.keys(alert.data).length > 0) {
        console.log(colorize(`  📄 Data: ${JSON.stringify(alert.data, null, 2)}`, 'gray'));
      }
      
      if (index < alerts.length - 1) {
        console.log('-'.repeat(40));
      }
    });
    
    console.log('='.repeat(80));
  }

  // Основной цикл мониторинга
  async runMonitoringCycle() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    const cycleStart = Date.now();
    
    console.log(colorize(`\n🔄 Цикл мониторинга начат: ${new Date().toLocaleString('ru-RU')}`, 'cyan'));
    
    try {
      // Проверяем здоровье сервисов
      const healthResults = await this.checkServiceHealth();
      
      // Получаем статистику
      const statsData = await this.getAppLogs('stats');
      if (statsData) {
        this.displayStats(statsData.stats);
        this.saveLogsToFile(statsData, 'stats');
      }
      
      // Получаем все логи
      const allLogsData = await this.getAppLogs('all', { limit: 200 });
      if (allLogsData) {
        this.saveLogsToFile(allLogsData, 'all');
        
        // Анализируем на ошибки
        const errors = this.analyzeLogsForErrors(allLogsData);
        const alerts = this.createAlerts(errors);
        
        if (alerts.length > 0) {
          this.displayAlerts(alerts);
          this.alertHistory.push(...alerts);
        }
      }
      
      // Получаем логи backend
      const backendLogsData = await this.getAppLogs('backend', { limit: 100 });
      if (backendLogsData) {
        this.saveLogsToFile(backendLogsData, 'backend');
      }
      
      // Получаем логи frontend
      const frontendLogsData = await this.getAppLogs('frontend', { limit: 100 });
      if (frontendLogsData) {
        this.saveLogsToFile(frontendLogsData, 'frontend');
      }
      
      const cycleDuration = Date.now() - cycleStart;
      console.log(colorize(`✅ Цикл мониторинга завершен за ${cycleDuration}ms`, 'green'));
      
      this.lastCheck = new Date();
      
    } catch (error) {
      console.error(colorize(`❌ Ошибка в цикле мониторинга: ${error.message}`, 'red'));
      this.errorCount++;
    } finally {
      this.isRunning = false;
    }
  }

  // Запуск непрерывного мониторинга
  async startContinuousMonitoring() {
    console.log(colorize('🚀 Запуск непрерывного мониторинга Render логов', 'green'));
    console.log(colorize(`📍 Интервал проверки: ${CONFIG.CHECK_INTERVAL / 1000} секунд`, 'gray'));
    console.log(colorize(`📍 Директория логов: ${CONFIG.LOGS_DIR}`, 'gray'));
    
    // Первый запуск
    await this.runMonitoringCycle();
    
    // Очистка старых логов
    this.cleanupOldLogs();
    
    // Устанавливаем интервал
    setInterval(async () => {
      await this.runMonitoringCycle();
    }, CONFIG.CHECK_INTERVAL);
    
    console.log(colorize('✅ Непрерывный мониторинг запущен', 'green'));
    console.log(colorize('💡 Нажмите Ctrl+C для остановки', 'yellow'));
  }

  // Одноразовая проверка
  async runSingleCheck() {
    console.log(colorize('🔍 Выполнение одноразовой проверки...', 'cyan'));
    await this.runMonitoringCycle();
    this.cleanupOldLogs();
    console.log(colorize('✅ Проверка завершена', 'green'));
  }
}

// Основная функция
async function main() {
  const monitor = new RenderLogsMonitor();
  
  const args = process.argv.slice(2);
  const mode = args[0] || 'single';
  
  try {
    if (mode === 'continuous') {
      await monitor.startContinuousMonitoring();
    } else {
      await monitor.runSingleCheck();
    }
  } catch (error) {
    console.error(colorize(`❌ Критическая ошибка: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Обработка сигналов
process.on('SIGINT', () => {
  console.log(colorize('\n🛑 Получен сигнал остановки', 'yellow'));
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(colorize('❌ Необработанная ошибка:', 'red'));
  console.error(reason);
});

// Запуск
if (require.main === module) {
  main();
}

module.exports = RenderLogsMonitor; 