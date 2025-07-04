// Используем встроенный fetch для Node.js 18+ или node-fetch для старых версий
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // В Node.js 18+ fetch доступен глобально
  fetch = global.fetch;
}
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:8000/api';
const LOG_DIR = './test_logs';

// Создаем директорию для логов если её нет
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class PerformanceTester {
  constructor() {
    this.logs = [];
    this.results = {
      requests: [],
      errors: [],
      responseTimes: [],
      throughput: []
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  success(message) {
    this.log(message, 'SUCCESS');
  }

  warning(message) {
    this.log(message, 'WARNING');
  }

  saveLogs(filename) {
    const filepath = path.join(LOG_DIR, filename);
    fs.writeFileSync(filepath, this.logs.join('\n'));
  }

  // Измерение времени выполнения запроса
  async measureRequest(url, options = {}) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const data = await response.json().catch(() => ({}));
      
      return {
        url,
        method: options.method || 'GET',
        status: response.status,
        responseTime,
        success: response.ok,
        data,
        error: null
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        url,
        method: options.method || 'GET',
        status: 0,
        responseTime,
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  // Тестирование нагрузки - множественные одновременные запросы
  async loadTest(endpoint, method = 'GET', options = {}, concurrency = 10, duration = 30000) {
    this.log(`🚀 Начинаем нагрузочное тестирование: ${method} ${endpoint}`);
    this.log(`📊 Параметры: ${concurrency} одновременных запросов, ${duration}ms длительность`);
    
    const url = `${API_BASE}${endpoint}`;
    const startTime = Date.now();
    const requests = [];
    const results = [];

    // Создаем пул запросов
    const makeRequest = async () => {
      while (Date.now() - startTime < duration) {
        const result = await this.measureRequest(url, { method, ...options });
        results.push(result);
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    // Запускаем одновременные запросы
    const promises = Array(concurrency).fill().map(() => makeRequest());
    await Promise.all(promises);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const totalRequests = results.length;

    // Анализ результатов
    const successfulRequests = results.filter(r => r.success);
    const failedRequests = results.filter(r => !r.success);
    const responseTimes = results.map(r => r.responseTime);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const throughput = (totalRequests / totalDuration) * 1000; // запросов в секунду

    this.log(`📈 Результаты нагрузочного тестирования ${endpoint}:`);
    this.log(`   - Всего запросов: ${totalRequests}`);
    this.log(`   - Успешных: ${successfulRequests.length}`);
    this.log(`   - Ошибок: ${failedRequests.length}`);
    this.log(`   - Среднее время ответа: ${avgResponseTime.toFixed(2)}ms`);
    this.log(`   - Минимальное время: ${minResponseTime}ms`);
    this.log(`   - Максимальное время: ${maxResponseTime}ms`);
    this.log(`   - Пропускная способность: ${throughput.toFixed(2)} req/s`);

    return {
      endpoint,
      totalRequests,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      throughput,
      results
    };
  }

  // Тестирование стресс-тестирования - постепенное увеличение нагрузки
  async stressTest(endpoint, method = 'GET', options = {}, maxConcurrency = 50) {
    this.log(`🔥 Начинаем стресс-тестирование: ${method} ${endpoint}`);
    
    const results = [];
    const concurrencyLevels = [1, 5, 10, 20, 30, 40, 50].filter(c => c <= maxConcurrency);

    for (const concurrency of concurrencyLevels) {
      this.log(`📊 Тестируем с ${concurrency} одновременными запросами...`);
      
      const result = await this.loadTest(endpoint, method, options, concurrency, 10000);
      results.push({
        concurrency,
        ...result
      });

      // Пауза между уровнями нагрузки
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Анализ результатов стресс-тестирования
    this.log(`📊 Анализ стресс-тестирования ${endpoint}:`);
    results.forEach(r => {
      this.log(`   ${r.concurrency} запросов: ${r.avgResponseTime.toFixed(2)}ms, ${r.throughput.toFixed(2)} req/s, ${r.failedRequests} ошибок`);
    });

    return results;
  }

  // Тестирование стабильности - длительное тестирование
  async stabilityTest(endpoint, method = 'GET', options = {}, duration = 60000) {
    this.log(`⏰ Начинаем тестирование стабильности: ${method} ${endpoint} (${duration/1000} секунд)`);
    
    const startTime = Date.now();
    const results = [];
    let requestCount = 0;

    while (Date.now() - startTime < duration) {
      const result = await this.measureRequest(`${API_BASE}${endpoint}`, { method, ...options });
      results.push(result);
      requestCount++;

      // Логируем прогресс каждые 10 секунд
      if (requestCount % 10 === 0) {
        const elapsed = Date.now() - startTime;
        this.log(`📊 Прогресс: ${requestCount} запросов за ${(elapsed/1000).toFixed(1)}s`);
      }

      // Небольшая задержка
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successfulRequests = results.filter(r => r.success);
    const failedRequests = results.filter(r => !r.success);
    const responseTimes = results.map(r => r.responseTime);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const throughput = (requestCount / (duration / 1000));

    this.log(`📈 Результаты тестирования стабильности ${endpoint}:`);
    this.log(`   - Всего запросов: ${requestCount}`);
    this.log(`   - Успешных: ${successfulRequests.length}`);
    this.log(`   - Ошибок: ${failedRequests.length}`);
    this.log(`   - Среднее время ответа: ${avgResponseTime.toFixed(2)}ms`);
    this.log(`   - Пропускная способность: ${throughput.toFixed(2)} req/s`);

    return {
      endpoint,
      totalRequests: requestCount,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      avgResponseTime,
      throughput,
      results
    };
  }

  // Тестирование различных эндпоинтов
  async testAllEndpoints() {
    this.log('🌐 Начинаем тестирование всех основных эндпоинтов...');

    const endpoints = [
      { path: '/health', method: 'GET', name: 'Health Check' },
      { path: '/users', method: 'GET', name: 'Get Users', auth: true },
      { path: '/posts', method: 'GET', name: 'Get Posts' },
      { path: '/posts', method: 'POST', name: 'Create Post', auth: true, body: { content: 'Test post', privacy: 'public' } },
      { path: '/messages', method: 'GET', name: 'Get Messages', auth: true }
    ];

    const results = {};

    for (const endpoint of endpoints) {
      this.log(`\n🔍 Тестируем: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
      
      const options = {};
      if (endpoint.auth) {
        // Для аутентифицированных запросов нужен токен
        // В реальном тесте нужно сначала залогиниться
        this.log(`⚠️ Пропускаем ${endpoint.name} - требуется аутентификация`);
        continue;
      }
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      // Быстрый тест производительности
      const perfResult = await this.loadTest(endpoint.path, endpoint.method, options, 5, 5000);
      results[endpoint.name] = perfResult;
    }

    return results;
  }

  // Тестирование базы данных
  async testDatabasePerformance() {
    this.log('🗄️ Тестирование производительности базы данных...');

    const results = {};

    // Тест чтения - получение постов с пагинацией
    this.log('📖 Тест чтения данных...');
    const readTest = await this.loadTest('/posts?page=1&limit=100', 'GET', {}, 10, 15000);
    results.readPerformance = readTest;

    // Тест создания данных (если есть токен)
    this.log('✍️ Тест создания данных...');
    const createTest = await this.loadTest('/posts', 'POST', {
      body: JSON.stringify({
        content: 'Performance test post',
        privacy: 'public',
        section: 'general'
      })
    }, 5, 10000);
    results.createPerformance = createTest;

    return results;
  }

  // Генерация отчета
  generateReport(allResults) {
    this.log('\n📋 ГЕНЕРАЦИЯ ОТЧЕТА О ПРОИЗВОДИТЕЛЬНОСТИ');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.keys(allResults).length,
        totalRequests: 0,
        totalErrors: 0,
        avgResponseTime: 0
      },
      details: allResults,
      recommendations: []
    };

    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let testCount = 0;

    Object.values(allResults).forEach(result => {
      if (result.totalRequests) {
        totalRequests += result.totalRequests;
        totalErrors += result.failedRequests || 0;
        totalResponseTime += result.avgResponseTime || 0;
        testCount++;
      }
    });

    report.summary.totalRequests = totalRequests;
    report.summary.totalErrors = totalErrors;
    report.summary.avgResponseTime = testCount > 0 ? totalResponseTime / testCount : 0;

    // Анализ и рекомендации
    if (report.summary.avgResponseTime > 1000) {
      report.recommendations.push('Высокое время ответа - рекомендуется оптимизация запросов к БД');
    }

    if (report.summary.totalErrors > totalRequests * 0.1) {
      report.recommendations.push('Высокий процент ошибок - требуется анализ и исправление');
    }

    const reportFile = path.join(LOG_DIR, 'performance_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`📄 Отчет сохранен в ${reportFile}`);
    
    return report;
  }

  // Основная функция тестирования
  async runPerformanceTests() {
    this.log('🚀 Начинаем комплексное тестирование производительности...\n');

    const allResults = {};

    try {
      // 1. Тестирование всех эндпоинтов
      this.log('=== ЭТАП 1: ТЕСТИРОВАНИЕ ЭНДПОИНТОВ ===');
      const endpointResults = await this.testAllEndpoints();
      allResults.endpoints = endpointResults;

      // 2. Нагрузочное тестирование основных эндпоинтов
      this.log('\n=== ЭТАП 2: НАГРУЗОЧНОЕ ТЕСТИРОВАНИЕ ===');
      const loadTestResults = await this.loadTest('/posts', 'GET', {}, 20, 30000);
      allResults.loadTest = loadTestResults;

      // 3. Стресс-тестирование
      this.log('\n=== ЭТАП 3: СТРЕСС-ТЕСТИРОВАНИЕ ===');
      const stressTestResults = await this.stressTest('/posts', 'GET', {}, 30);
      allResults.stressTest = stressTestResults;

      // 4. Тестирование стабильности
      this.log('\n=== ЭТАП 4: ТЕСТИРОВАНИЕ СТАБИЛЬНОСТИ ===');
      const stabilityResults = await this.stabilityTest('/posts', 'GET', {}, 30000);
      allResults.stabilityTest = stabilityResults;

      // 5. Тестирование производительности БД
      this.log('\n=== ЭТАП 5: ТЕСТИРОВАНИЕ БАЗЫ ДАННЫХ ===');
      const dbResults = await this.testDatabasePerformance();
      allResults.database = dbResults;

      // 6. Генерация отчета
      this.log('\n=== ЭТАП 6: ГЕНЕРАЦИЯ ОТЧЕТА ===');
      const report = this.generateReport(allResults);

      this.log('\n✅ Тестирование производительности завершено!');
      this.log(`📊 Итоговая статистика:`);
      this.log(`   - Всего запросов: ${report.summary.totalRequests}`);
      this.log(`   - Ошибок: ${report.summary.totalErrors}`);
      this.log(`   - Среднее время ответа: ${report.summary.avgResponseTime.toFixed(2)}ms`);

      if (report.recommendations.length > 0) {
        this.log(`💡 Рекомендации:`);
        report.recommendations.forEach(rec => this.log(`   - ${rec}`));
      }

    } catch (error) {
      this.error(`Критическая ошибка при тестировании: ${error.message}`);
    }

    // Сохраняем логи
    this.saveLogs('performance_test.log');
    
    return allResults;
  }
}

// Запуск тестирования
async function main() {
  const tester = new PerformanceTester();
  
  try {
    await tester.runPerformanceTests();
  } catch (error) {
    console.error('❌ Ошибка при запуске тестирования производительности:', error);
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  main();
}

module.exports = PerformanceTester; 