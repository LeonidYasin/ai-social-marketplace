#!/usr/bin/env node

/**
 * Получение системных логов Render.com
 * Включает логи развертывания, системные события и метрики
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
  RENDER_API_TOKEN: process.env.RENDER_API_TOKEN, // Токен для доступа к API Render
  RENDER_SERVICE_ID: process.env.RENDER_SERVICE_ID // ID сервиса на Render
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

class RenderSystemLogsCollector {
  constructor() {
    this.systemLogs = [];
    this.deploymentLogs = [];
    this.metrics = {};
  }

  // HTTP запрос с авторизацией
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
          'User-Agent': 'Render-System-Logs-Collector/1.0',
          'Accept': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 15000
      };

      // Добавляем авторизацию если есть токен
      if (CONFIG.RENDER_API_TOKEN) {
        requestOptions.headers['Authorization'] = `Bearer ${CONFIG.RENDER_API_TOKEN}`;
      }

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

  // Получение системной информации через health check
  async getSystemInfo() {
    console.log(colorize('🔍 Получение системной информации...', 'cyan'));
    
    try {
      const response = await this.makeRequest(`${CONFIG.RENDER_API_URL}/api/health`);
      
      if (response.status === 200) {
        const info = {
          timestamp: new Date().toISOString(),
          service: 'backend',
          status: 'healthy',
          data: response.data
        };
        
        this.systemLogs.push(info);
        console.log(colorize('✅ Системная информация получена', 'green'));
        return info;
      }
    } catch (error) {
      console.log(colorize(`❌ Ошибка получения системной информации: ${error.message}`, 'red'));
    }
    
    return null;
  }

  // Получение метрик производительности
  async getPerformanceMetrics() {
    console.log(colorize('📊 Получение метрик производительности...', 'cyan'));
    
    const metrics = {
      timestamp: new Date().toISOString(),
      service: 'backend',
      type: 'performance'
    };

    try {
      // Проверяем время отклика
      const startTime = Date.now();
      const response = await this.makeRequest(`${CONFIG.RENDER_API_URL}/api/health`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      metrics.responseTime = responseTime;
      metrics.status = response.status;
      metrics.healthy = response.status === 200;
      
      // Проверяем размер ответа
      if (response.data) {
        metrics.responseSize = JSON.stringify(response.data).length;
      }
      
    } catch (error) {
      metrics.error = error.message;
      metrics.healthy = false;
    }

    this.metrics = metrics;
    console.log(colorize('✅ Метрики производительности получены', 'green'));
    return metrics;
  }

  // Получение информации о развертывании
  async getDeploymentInfo() {
    console.log(colorize('🚀 Получение информации о развертывании...', 'cyan'));
    
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      service: 'backend',
      type: 'deployment'
    };

    try {
      // Пытаемся получить информацию через переменные окружения
      const envResponse = await this.makeRequest(`${CONFIG.RENDER_API_URL}/api/debug/env`);
      
      if (envResponse.status === 200 && envResponse.data) {
        deploymentInfo.environment = {
          nodeEnv: envResponse.data.NODE_ENV,
          render: envResponse.data.RENDER,
          renderServiceId: envResponse.data.RENDER_SERVICE_ID,
          renderServiceName: envResponse.data.RENDER_SERVICE_NAME,
          renderEnvironment: envResponse.data.RENDER_ENVIRONMENT
        };
      }
      
    } catch (error) {
      deploymentInfo.error = error.message;
    }

    this.deploymentLogs.push(deploymentInfo);
    console.log(colorize('✅ Информация о развертывании получена', 'green'));
    return deploymentInfo;
  }

  // Получение логов через Render API (если доступно)
  async getRenderApiLogs() {
    if (!CONFIG.RENDER_API_TOKEN || !CONFIG.RENDER_SERVICE_ID) {
      console.log(colorize('⚠️ Токен Render API или ID сервиса не настроены', 'yellow'));
      return null;
    }

    console.log(colorize('📡 Получение логов через Render API...', 'cyan'));
    
    try {
      const url = `https://api.render.com/v1/services/${CONFIG.RENDER_SERVICE_ID}/logs`;
      const response = await this.makeRequest(url, {
        headers: {
          'Authorization': `Bearer ${CONFIG.RENDER_API_TOKEN}`
        }
      });
      
      if (response.status === 200) {
        console.log(colorize('✅ Логи получены через Render API', 'green'));
        return response.data;
      } else {
        console.log(colorize(`⚠️ Render API вернул статус: ${response.status}`, 'yellow'));
      }
    } catch (error) {
      console.log(colorize(`❌ Ошибка получения логов через Render API: ${error.message}`, 'red'));
    }
    
    return null;
  }

  // Получение информации о ресурсах
  async getResourceInfo() {
    console.log(colorize('💾 Получение информации о ресурсах...', 'cyan'));
    
    const resourceInfo = {
      timestamp: new Date().toISOString(),
      service: 'backend',
      type: 'resources'
    };

    try {
      // Пытаемся получить информацию о памяти и CPU
      const resourceResponse = await this.makeRequest(`${CONFIG.RENDER_API_URL}/api/debug/resources`);
      
      if (resourceResponse.status === 200 && resourceResponse.data) {
        resourceInfo.data = resourceResponse.data;
      }
      
    } catch (error) {
      resourceInfo.error = error.message;
    }

    this.systemLogs.push(resourceInfo);
    console.log(colorize('✅ Информация о ресурсах получена', 'green'));
    return resourceInfo;
  }

  // Получение информации о сети
  async getNetworkInfo() {
    console.log(colorize('🌐 Получение сетевой информации...', 'cyan'));
    
    const networkInfo = {
      timestamp: new Date().toISOString(),
      service: 'backend',
      type: 'network'
    };

    try {
      // Проверяем доступность frontend
      const frontendResponse = await this.makeRequest(CONFIG.RENDER_FRONTEND_URL, { timeout: 5000 });
      networkInfo.frontend = {
        status: frontendResponse.status,
        accessible: frontendResponse.status === 200
      };
      
      // Проверяем доступность backend
      const backendResponse = await this.makeRequest(`${CONFIG.RENDER_API_URL}/api/health`, { timeout: 5000 });
      networkInfo.backend = {
        status: backendResponse.status,
        accessible: backendResponse.status === 200
      };
      
    } catch (error) {
      networkInfo.error = error.message;
    }

    this.systemLogs.push(networkInfo);
    console.log(colorize('✅ Сетевая информация получена', 'green'));
    return networkInfo;
  }

  // Сохранение всех данных в файл
  saveAllData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `render-system-logs-${timestamp}.json`;
    const filepath = path.join(CONFIG.LOGS_DIR, filename);
    
    // Создаем папку logs если её нет
    if (!fs.existsSync(CONFIG.LOGS_DIR)) {
      fs.mkdirSync(CONFIG.LOGS_DIR);
    }
    
    const allData = {
      timestamp: new Date().toISOString(),
      collector: 'RenderSystemLogsCollector',
      version: '1.0',
      systemLogs: this.systemLogs,
      deploymentLogs: this.deploymentLogs,
      metrics: this.metrics,
      summary: {
        totalSystemLogs: this.systemLogs.length,
        totalDeploymentLogs: this.deploymentLogs.length,
        hasMetrics: Object.keys(this.metrics).length > 0
      }
    };
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(allData, null, 2));
      console.log(colorize(`💾 Системные логи сохранены: ${filepath}`, 'green'));
      return filepath;
    } catch (error) {
      console.error(colorize(`❌ Ошибка сохранения: ${error.message}`, 'red'));
      return null;
    }
  }

  // Вывод сводки
  displaySummary() {
    console.log(colorize('\n📋 Сводка собранных данных:', 'cyan'));
    console.log('='.repeat(50));
    
    console.log(`🔧 Системные логи: ${this.systemLogs.length}`);
    console.log(`🚀 Логи развертывания: ${this.deploymentLogs.length}`);
    console.log(`📊 Метрики: ${Object.keys(this.metrics).length > 0 ? 'Да' : 'Нет'}`);
    
    if (this.metrics.responseTime) {
      console.log(`⏱️ Время отклика: ${this.metrics.responseTime}ms`);
    }
    
    if (this.metrics.healthy !== undefined) {
      console.log(`🏥 Статус здоровья: ${this.metrics.healthy ? '✅' : '❌'}`);
    }
    
    console.log('='.repeat(50));
  }

  // Основная функция сбора данных
  async collectAllData() {
    console.log(colorize('🚀 Сбор системных логов Render', 'green'));
    console.log(colorize(`📍 Backend: ${CONFIG.RENDER_API_URL}`, 'gray'));
    console.log(colorize(`📍 Frontend: ${CONFIG.RENDER_FRONTEND_URL}`, 'gray'));
    
    const tasks = [
      { name: 'Системная информация', fn: () => this.getSystemInfo() },
      { name: 'Метрики производительности', fn: () => this.getPerformanceMetrics() },
      { name: 'Информация о развертывании', fn: () => this.getDeploymentInfo() },
      { name: 'Информация о ресурсах', fn: () => this.getResourceInfo() },
      { name: 'Сетевая информация', fn: () => this.getNetworkInfo() },
      { name: 'Логи Render API', fn: () => this.getRenderApiLogs() }
    ];

    for (const task of tasks) {
      console.log(colorize(`\n📋 ${task.name}...`, 'cyan'));
      await task.fn();
    }

    this.displaySummary();
    this.saveAllData();
    
    console.log(colorize('\n✅ Сбор системных логов завершен!', 'green'));
  }
}

// Функция для настройки переменных окружения
function setupEnvironment() {
  console.log(colorize('🔧 Настройка переменных окружения...', 'cyan'));
  
  const envFile = '.env';
  const envContent = `# Render System Logs Configuration
RENDER_API_TOKEN=your_render_api_token_here
RENDER_SERVICE_ID=your_service_id_here

# Получите токен на: https://render.com/docs/api
# Получите ID сервиса из URL вашего сервиса на Render
`;

  if (!fs.existsSync(envFile)) {
    try {
      fs.writeFileSync(envFile, envContent);
      console.log(colorize('✅ Файл .env создан', 'green'));
      console.log(colorize('📝 Заполните RENDER_API_TOKEN и RENDER_SERVICE_ID', 'yellow'));
    } catch (error) {
      console.error(colorize(`❌ Ошибка создания .env: ${error.message}`, 'red'));
    }
  } else {
    console.log(colorize('⚠️ Файл .env уже существует', 'yellow'));
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'collect';

  if (command === 'setup') {
    setupEnvironment();
    return;
  }

  const collector = new RenderSystemLogsCollector();
  
  try {
    await collector.collectAllData();
  } catch (error) {
    console.error(colorize(`❌ Критическая ошибка: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error(colorize('❌ Необработанная ошибка:', 'red'));
  console.error(reason);
});

// Запуск
if (require.main === module) {
  main();
}

module.exports = RenderSystemLogsCollector; 