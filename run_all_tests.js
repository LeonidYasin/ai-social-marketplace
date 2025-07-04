const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Используем встроенный fetch для Node.js 18+ или node-fetch для старых версий
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  // В Node.js 18+ fetch доступен глобально
  fetch = global.fetch;
}

const LOG_DIR = './test_logs';

// Создаем директорию для логов если её нет
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class TestRunner {
  constructor() {
    this.logs = [];
    this.results = {
      multiuser: null,
      performance: null,
      security: null,
      ui: null
    };
    this.startTime = null;
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

  // Запуск теста как отдельного процесса
  async runTest(testFile, testName) {
    return new Promise((resolve, reject) => {
      this.log(`🚀 Запуск ${testName}...`);
      
      const testProcess = spawn('node', [testFile], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          this.success(`✅ ${testName} завершен успешно`);
          resolve({ success: true, output, errorOutput, code });
        } else {
          this.error(`❌ ${testName} завершен с ошибкой (код: ${code})`);
          resolve({ success: false, output, errorOutput, code });
        }
      });

      testProcess.on('error', (error) => {
        this.error(`❌ Ошибка запуска ${testName}: ${error.message}`);
        reject(error);
      });
    });
  }

  // Проверка доступности API
  async checkAPIAvailability() {
    this.log('🔍 Проверка доступности API...');
    
    try {
      const response = await fetch('http://localhost:8000/api/health');
      if (response.ok) {
        this.success('✅ API доступен');
        return true;
      } else {
        this.error(`❌ API недоступен (статус: ${response.status})`);
        return false;
      }
    } catch (error) {
      this.error(`❌ API недоступен: ${error.message}`);
      return false;
    }
  }

  // Проверка доступности фронтенда
  async checkFrontendAvailability() {
    this.log('🔍 Проверка доступности фронтенда...');
    
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        this.success('✅ Фронтенд доступен');
        return true;
      } else {
        this.error(`❌ Фронтенд недоступен (статус: ${response.status})`);
        return false;
      }
    } catch (error) {
      this.error(`❌ Фронтенд недоступен: ${error.message}`);
      return false;
    }
  }

  // Запуск многопользовательского тестирования
  async runMultiUserTests() {
    this.log('\n=== МНОГОПОЛЬЗОВАТЕЛЬСКОЕ ТЕСТИРОВАНИЕ ===');
    
    const result = await this.runTest('test_multiuser_advanced.js', 'Расширенное многопользовательское тестирование');
    this.results.multiuser = result;
    
    return result;
  }

  // Запуск тестирования производительности
  async runPerformanceTests() {
    this.log('\n=== ТЕСТИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ ===');
    
    const result = await this.runTest('test_performance.js', 'Тестирование производительности');
    this.results.performance = result;
    
    return result;
  }

  // Запуск тестирования безопасности
  async runSecurityTests() {
    this.log('\n=== ТЕСТИРОВАНИЕ БЕЗОПАСНОСТИ ===');
    
    const result = await this.runTest('test_security.js', 'Тестирование безопасности');
    this.results.security = result;
    
    return result;
  }

  // Запуск UI тестирования
  async runUITests() {
    this.log('\n=== UI ТЕСТИРОВАНИЕ ===');
    
    // Проверяем наличие интегрированного визуального теста
    if (fs.existsSync('test_visual_integrated.js')) {
      this.log('🔍 Найден интегрированный визуальный тест');
      const result = await this.runTest('test_visual_integrated.js', 'Интегрированное визуальное тестирование');
      this.results.ui = result;
      return result;
    }
    
    // Проверяем наличие старых UI тестов
    const uiTestFiles = [
      'test_ui_automation.js',
      'test_ui_complete_fix.js',
      'test_ui_final.js'
    ];

    for (const testFile of uiTestFiles) {
      if (fs.existsSync(testFile)) {
        this.log(`🔍 Найден UI тест: ${testFile}`);
        const result = await this.runTest(testFile, `UI тест: ${testFile}`);
        this.results.ui = result;
        break;
      }
    }

    if (!this.results.ui) {
      this.warning('⚠️ UI тесты не найдены');
    }
    
    return this.results.ui;
  }

  // Генерация сводного отчета
  generateSummaryReport() {
    this.log('\n📋 ГЕНЕРАЦИЯ СВОДНОГО ОТЧЕТА');
    
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        totalTests: Object.keys(this.results).length,
        successfulTests: 0,
        failedTests: 0,
        skippedTests: 0
      },
      details: {},
      recommendations: []
    };

    // Анализируем результаты
    Object.entries(this.results).forEach(([testType, result]) => {
      if (result) {
        if (result.success) {
          report.summary.successfulTests++;
          report.details[testType] = { status: 'PASSED', code: result.code };
        } else {
          report.summary.failedTests++;
          report.details[testType] = { status: 'FAILED', code: result.code };
        }
      } else {
        report.summary.skippedTests++;
        report.details[testType] = { status: 'SKIPPED' };
      }
    });

    // Генерируем рекомендации
    if (report.summary.failedTests > 0) {
      report.recommendations.push('Исправить проваленные тесты');
    }

    if (report.summary.skippedTests > 0) {
      report.recommendations.push('Добавить недостающие тесты');
    }

    if (totalDuration > 300000) { // 5 минут
      report.recommendations.push('Оптимизировать время выполнения тестов');
    }

    // Сохраняем отчет
    const reportFile = path.join(LOG_DIR, 'test_summary_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`📄 Сводный отчет сохранен в ${reportFile}`);
    
    return report;
  }

  // Основная функция запуска всех тестов
  async runAllTests() {
    this.startTime = Date.now();
    this.log('🚀 Начинаем комплексное тестирование системы...\n');

    try {
      // Проверка доступности сервисов
      this.log('=== ПРОВЕРКА ДОСТУПНОСТИ СЕРВИСОВ ===');
      const apiAvailable = await this.checkAPIAvailability();
      const frontendAvailable = await this.checkFrontendAvailability();

      if (!apiAvailable) {
        this.error('❌ API недоступен. Убедитесь, что бэкенд запущен на порту 8000');
        this.log('💡 Запустите бэкенд: cd backend && npm start');
        return;
      }

      if (!frontendAvailable) {
        this.warning('⚠️ Фронтенд недоступен. Некоторые тесты могут не работать');
        this.log('💡 Запустите фронтенд: cd frontend && npm start');
      }

      // Запуск тестов
      const testPromises = [
        this.runMultiUserTests(),
        this.runPerformanceTests(),
        this.runSecurityTests(),
        this.runUITests()
      ];

      // Ждем завершения всех тестов
      await Promise.all(testPromises);

      // Генерация отчета
      this.log('\n=== ГЕНЕРАЦИЯ ОТЧЕТА ===');
      const report = this.generateSummaryReport();

      // Финальная статистика
      this.log('\n🎉 Комплексное тестирование завершено!');
      this.log(`📊 Итоговая статистика:`);
      this.log(`   - Всего тестов: ${report.summary.totalTests}`);
      this.log(`   - Успешно: ${report.summary.successfulTests}`);
      this.log(`   - Провалено: ${report.summary.failedTests}`);
      this.log(`   - Пропущено: ${report.summary.skippedTests}`);
      this.log(`   - Время выполнения: ${(totalDuration / 1000).toFixed(1)} секунд`);

      if (report.recommendations.length > 0) {
        this.log(`💡 Рекомендации:`);
        report.recommendations.forEach(rec => this.log(`   - ${rec}`));
      }

      // Сохраняем логи
      this.saveLogs('all_tests.log');

    } catch (error) {
      this.error(`Критическая ошибка при выполнении тестов: ${error.message}`);
    }
  }
}

// Функция для запуска отдельных тестов
async function runSpecificTest(testType) {
  const runner = new TestRunner();
  
  switch (testType) {
    case 'multiuser':
      await runner.runMultiUserTests();
      break;
    case 'performance':
      await runner.runPerformanceTests();
      break;
    case 'security':
      await runner.runSecurityTests();
      break;
    case 'ui':
      await runner.runUITests();
      break;
    default:
      console.error('❌ Неизвестный тип теста. Доступные: multiuser, performance, security, ui');
      process.exit(1);
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Запуск конкретного теста
    await runSpecificTest(args[0]);
  } else {
    // Запуск всех тестов
    const runner = new TestRunner();
    await runner.runAllTests();
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = TestRunner; 