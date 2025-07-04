const { OCRMasterBot } = require('./ocr_master_bot');

class FinalMultiUserTester {
  constructor() {
    this.bot = null;
    this.results = [];
  }

  async initialize() {
    console.log('🚀 Инициализация финального многопользовательского тестера...');
    
    this.bot = new OCRMasterBot();
    await this.bot.init(3); // Инициализируем с 3 браузерами для симуляции 3 пользователей
    console.log('✅ Бот инициализирован с 3 браузерами');
  }

  async runComprehensiveTest() {
    console.log('\n🎯 Запуск комплексного многопользовательского теста...');
    
    const scenario = {
      name: 'Комплексный многопользовательский тест',
      description: 'Полное тестирование всех функций с тремя пользователями',
      steps: [
        {
          action: 'navigate',
          url: 'http://localhost:3000',
          description: 'Открытие приложения в трех браузерах'
        },
        {
          action: 'wait',
          duration: 3000,
          description: 'Ожидание загрузки'
        },
        // Вход всех пользователей
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'вход первого пользователя'
        },
        {
          action: 'click',
          browserIndex: 1,
          text: 'гость',
          description: 'вход второго пользователя'
        },
        {
          action: 'click',
          browserIndex: 2,
          text: 'гость',
          description: 'вход третьего пользователя'
        },
        // Ожидание входа всех пользователей
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа первого пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 1,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа второго пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 2,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа третьего пользователя'
        },
        // Проверка основных элементов интерфейса
        {
          action: 'verify',
          browserIndex: 0,
          text: 'нравится',
          description: 'кнопка лайка в первом браузере',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 1,
          text: 'нравится',
          description: 'кнопка лайка во втором браузере',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 2,
          text: 'нравится',
          description: 'кнопка лайка в третьем браузере',
          required: false
        },
        // Проверка кнопки комментариев
        {
          action: 'verify',
          browserIndex: 0,
          text: 'комментировать',
          description: 'кнопка комментария в первом браузере',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 1,
          text: 'комментировать',
          description: 'кнопка комментария во втором браузере',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 2,
          text: 'комментировать',
          description: 'кнопка комментария в третьем браузере',
          required: false
        }
      ]
    };

    try {
      const result = await this.bot.runScenario(scenario);
      this.results.push({
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        errors: result.errors
      });
      
      console.log(`✅ Сценарий "${scenario.name}" завершен`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка в сценарии "${scenario.name}":`, error);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runInteractionTest() {
    console.log('\n💬 Запуск теста взаимодействия...');
    
    const scenario = {
      name: 'Тест взаимодействия между пользователями',
      description: 'Тестирование лайков и комментариев между пользователями',
      steps: [
        {
          action: 'navigate',
          url: 'http://localhost:3000',
          description: 'Открытие приложения'
        },
        {
          action: 'wait',
          duration: 3000,
          description: 'Ожидание загрузки'
        },
        // Первый пользователь входит
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'вход первого пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа'
        },
        // Второй пользователь лайкает пост
        {
          action: 'click',
          browserIndex: 1,
          text: 'гость',
          description: 'вход второго пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 1,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа'
        },
        {
          action: 'click',
          browserIndex: 1,
          text: 'нравится',
          description: 'лайк поста вторым пользователем',
          required: false
        },
        // Третий пользователь комментирует
        {
          action: 'click',
          browserIndex: 2,
          text: 'гость',
          description: 'вход третьего пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 2,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа'
        },
        {
          action: 'click',
          browserIndex: 2,
          text: 'комментировать',
          description: 'открытие комментария третьим пользователем',
          required: false
        }
      ]
    };

    try {
      const result = await this.bot.runScenario(scenario);
      this.results.push({
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        errors: result.errors
      });
      
      console.log(`✅ Сценарий "${scenario.name}" завершен`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка в сценарии "${scenario.name}":`, error);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runRealTimeSyncTest() {
    console.log('\n⚡ Запуск теста синхронизации в реальном времени...');
    
    const scenario = {
      name: 'Тест синхронизации в реальном времени',
      description: 'Тестирование синхронизации действий между пользователями',
      steps: [
        {
          action: 'navigate',
          url: 'http://localhost:3000',
          description: 'Открытие приложения'
        },
        {
          action: 'wait',
          duration: 3000,
          description: 'Ожидание загрузки'
        },
        // Все пользователи входят одновременно
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'вход первого пользователя'
        },
        {
          action: 'click',
          browserIndex: 1,
          text: 'гость',
          description: 'вход второго пользователя'
        },
        {
          action: 'click',
          browserIndex: 2,
          text: 'гость',
          description: 'вход третьего пользователя'
        },
        // Ожидание входа всех пользователей
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа первого пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 1,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа второго пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 2,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа третьего пользователя'
        },
        // Одновременные действия
        {
          action: 'click',
          browserIndex: 0,
          text: 'нравится',
          description: 'лайк от первого пользователя',
          required: false
        },
        {
          action: 'click',
          browserIndex: 1,
          text: 'нравится',
          description: 'лайк от второго пользователя',
          required: false
        },
        {
          action: 'click',
          browserIndex: 2,
          text: 'нравится',
          description: 'лайк от третьего пользователя',
          required: false
        }
      ]
    };

    try {
      const result = await this.bot.runScenario(scenario);
      this.results.push({
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        errors: result.errors
      });
      
      console.log(`✅ Сценарий "${scenario.name}" завершен`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка в сценарии "${scenario.name}":`, error);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runPerformanceTest() {
    console.log('\n⚡ Запуск теста производительности...');
    
    const startTime = Date.now();
    
    const scenario = {
      name: 'Тест производительности',
      description: 'Тестирование производительности при одновременной работе трех пользователей',
      steps: [
        {
          action: 'navigate',
          url: 'http://localhost:3000',
          description: 'Открытие приложения'
        },
        {
          action: 'wait',
          duration: 2000,
          description: 'Краткое ожидание загрузки'
        },
        // Быстрый вход всех пользователей
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'быстрый вход первого пользователя'
        },
        {
          action: 'click',
          browserIndex: 1,
          text: 'гость',
          description: 'быстрый вход второго пользователя'
        },
        {
          action: 'click',
          browserIndex: 2,
          text: 'гость',
          description: 'быстрый вход третьего пользователя'
        },
        // Быстрая проверка входа
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 5000,
          description: 'быстрая проверка входа первого пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 1,
          text: 'пост',
          timeout: 5000,
          description: 'быстрая проверка входа второго пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 2,
          text: 'пост',
          timeout: 5000,
          description: 'быстрая проверка входа третьего пользователя'
        }
      ]
    };

    try {
      const result = await this.bot.runScenario(scenario);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.results.push({
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        errors: result.errors,
        performance: {
          duration: duration,
          averageStepTime: duration / scenario.steps.length
        }
      });
      
      console.log(`✅ Сценарий "${scenario.name}" завершен за ${duration}ms`);
      console.log(`📊 Среднее время на шаг: ${(duration / scenario.steps.length).toFixed(0)}ms`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка в сценарии "${scenario.name}":`, error);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  generateFinalReport() {
    console.log('\n📊 ГЕНЕРАЦИЯ ФИНАЛЬНОГО ОТЧЕТА О ТЕСТИРОВАНИИ');
    console.log('=' .repeat(60));
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`📈 Общая статистика:`);
    console.log(`   Всего тестов: ${totalTests}`);
    console.log(`   Успешных: ${successfulTests}`);
    console.log(`   Неудачных: ${failedTests}`);
    console.log(`   Процент успеха: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Детальные результаты:');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`\n${status} ${result.scenario}`);
      
      if (!result.success && result.error) {
        console.log(`   ❌ Ошибка: ${result.error}`);
      }
      
      if (result.steps) {
        const successfulSteps = result.steps.filter(s => s.success).length;
        const totalSteps = result.steps.length;
        const stepSuccessRate = ((successfulSteps / totalSteps) * 100).toFixed(1);
        console.log(`   📊 Шагов выполнено: ${successfulSteps}/${totalSteps} (${stepSuccessRate}%)`);
        
        // Показываем неудачные шаги
        const failedSteps = result.steps.filter(s => !s.success);
        if (failedSteps.length > 0) {
          console.log(`   ⚠️ Неудачные шаги:`);
          failedSteps.forEach(step => {
            console.log(`      - Шаг ${step.step}: ${step.description}`);
            if (step.error) {
              console.log(`        Ошибка: ${step.error}`);
            }
          });
        }
      }
      
      if (result.performance) {
        console.log(`   ⚡ Производительность: ${result.performance.duration}ms (${result.performance.averageStepTime.toFixed(0)}ms/шаг)`);
      }
    });
    
    // Анализ производительности
    const performanceTests = this.results.filter(r => r.performance);
    if (performanceTests.length > 0) {
      console.log('\n⚡ Анализ производительности:');
      const avgDuration = performanceTests.reduce((sum, r) => sum + r.performance.duration, 0) / performanceTests.length;
      const avgStepTime = performanceTests.reduce((sum, r) => sum + r.performance.averageStepTime, 0) / performanceTests.length;
      console.log(`   Среднее время выполнения: ${avgDuration.toFixed(0)}ms`);
      console.log(`   Среднее время на шаг: ${avgStepTime.toFixed(0)}ms`);
    }
    
    // Рекомендации
    console.log('\n💡 Рекомендации:');
    const allSteps = this.results.flatMap(r => r.steps || []);
    const failedSteps = allSteps.filter(s => !s.success);
    
    if (failedSteps.length > 0) {
      console.log('   ⚠️ Проблемные области:');
      const commonIssues = {};
      failedSteps.forEach(step => {
        const issue = step.description;
        commonIssues[issue] = (commonIssues[issue] || 0) + 1;
      });
      
      Object.entries(commonIssues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([issue, count]) => {
          console.log(`      - ${issue}: ${count} раз`);
        });
    }
    
    // Сохранение отчета в файл
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: (successfulTests / totalTests) * 100
      },
      results: this.results,
      performance: performanceTests.length > 0 ? {
        averageDuration: performanceTests.reduce((sum, r) => sum + r.performance.duration, 0) / performanceTests.length,
        averageStepTime: performanceTests.reduce((sum, r) => sum + r.performance.averageStepTime, 0) / performanceTests.length
      } : null,
      recommendations: {
        commonIssues: failedSteps.length > 0 ? Object.entries(
          failedSteps.reduce((acc, step) => {
            const issue = step.description;
            acc[issue] = (acc[issue] || 0) + 1;
            return acc;
          }, {})
        ).sort(([,a], [,b]) => b - a).slice(0, 3) : []
      }
    };
    
    const fs = require('fs');
    const reportPath = './test_logs/final_multiuser_report.json';
    
    if (!fs.existsSync('./test_logs')) {
      fs.mkdirSync('./test_logs', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Финальный отчет сохранен в: ${reportPath}`);
    
    // Создание HTML отчета
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = './test_logs/final_multiuser_report.html';
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`🌐 HTML отчет сохранен в: ${htmlPath}`);
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет о многопользовательском тестировании</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .summary { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .test-result { margin: 15px 0; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border-left: 5px solid #28a745; }
        .failure { background: #f8d7da; border-left: 5px solid #dc3545; }
        .performance { background: #d1ecf1; border-left: 5px solid #17a2b8; }
        .step { margin: 5px 0; padding: 5px; }
        .step.success { background: #d4edda; }
        .step.failure { background: #f8d7da; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .timestamp { color: #666; text-align: center; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Отчет о многопользовательском тестировании</h1>
        <p class="timestamp">Сгенерирован: ${new Date(report.timestamp).toLocaleString('ru-RU')}</p>
        
        <div class="summary">
            <h2>📈 Общая статистика</h2>
            <p><strong>Всего тестов:</strong> ${report.summary.totalTests}</p>
            <p><strong>Успешных:</strong> ${report.summary.successfulTests}</p>
            <p><strong>Неудачных:</strong> ${report.summary.failedTests}</p>
            <p><strong>Процент успеха:</strong> ${report.summary.successRate.toFixed(1)}%</p>
        </div>
        
        <h2>📋 Детальные результаты</h2>
        ${report.results.map(result => `
            <div class="test-result ${result.success ? 'success' : 'failure'}">
                <h3>${result.success ? '✅' : '❌'} ${result.scenario}</h3>
                ${result.steps ? `
                    <p><strong>Шагов выполнено:</strong> ${result.steps.filter(s => s.success).length}/${result.steps.length}</p>
                    ${result.steps.map(step => `
                        <div class="step ${step.success ? 'success' : 'failure'}">
                            <strong>Шаг ${step.step}:</strong> ${step.description}
                            ${!step.success && step.error ? `<br><em>Ошибка: ${step.error}</em>` : ''}
                        </div>
                    `).join('')}
                ` : ''}
                ${result.performance ? `
                    <div class="performance">
                        <p><strong>Производительность:</strong> ${result.performance.duration}ms (${result.performance.averageStepTime.toFixed(0)}ms/шаг)</p>
                    </div>
                ` : ''}
            </div>
        `).join('')}
        
        ${report.recommendations.commonIssues.length > 0 ? `
            <div class="recommendations">
                <h2>💡 Рекомендации</h2>
                <h3>Проблемные области:</h3>
                <ul>
                    ${report.recommendations.commonIssues.map(([issue, count]) => `
                        <li><strong>${issue}:</strong> ${count} раз</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
        
        ${report.performance ? `
            <div class="performance">
                <h2>⚡ Анализ производительности</h2>
                <p><strong>Среднее время выполнения:</strong> ${report.performance.averageDuration.toFixed(0)}ms</p>
                <p><strong>Среднее время на шаг:</strong> ${report.performance.averageStepTime.toFixed(0)}ms</p>
            </div>
        ` : ''}
    </div>
</body>
</html>
    `;
  }

  async cleanup() {
    console.log('\n🧹 Очистка ресурсов...');
    
    if (this.bot) {
      await this.bot.close();
      console.log('✅ Бот очищен');
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n🎯 ЗАПУСК ФИНАЛЬНЫХ МНОГОПОЛЬЗОВАТЕЛЬСКИХ ТЕСТОВ');
      console.log('=' .repeat(60));
      
      // Тест 1: Комплексный тест
      await this.runComprehensiveTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 2: Взаимодействие
      await this.runInteractionTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 3: Синхронизация в реальном времени
      await this.runRealTimeSyncTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 4: Производительность
      await this.runPerformanceTest();
      
      // Генерация финального отчета
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Критическая ошибка в тестировании:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Проверка, что серверы запущены
async function checkServers() {
  const http = require('http');
  
  const checkServer = (port, name) => {
    return new Promise((resolve) => {
      const req = http.request(`http://localhost:${port}`, { method: 'HEAD' }, (res) => {
        console.log(`✅ ${name} доступен на порту ${port}`);
        resolve(true);
      });
      
      req.on('error', () => {
        console.log(`❌ ${name} недоступен на порту ${port}`);
        resolve(false);
      });
      
      req.setTimeout(3000, () => {
        console.log(`⏰ Таймаут подключения к ${name} на порту ${port}`);
        resolve(false);
      });
      
      req.end();
    });
  };
  
  const backendOk = await checkServer(8000, 'Backend');
  const frontendOk = await checkServer(3000, 'Frontend');
  
  if (!backendOk || !frontendOk) {
    console.log('\n⚠️ ВНИМАНИЕ: Не все серверы запущены!');
    console.log('Убедитесь, что backend и frontend запущены перед тестированием.');
    console.log('Backend: npm start (порт 8000)');
    console.log('Frontend: npm start (порт 3000)');
    return false;
  }
  
  return true;
}

// Запуск тестов
async function main() {
  const tester = new FinalMultiUserTester();
  await tester.runAllTests();
}

// Запуск с проверкой серверов
if (require.main === module) {
  checkServers().then(serversOk => {
    if (serversOk) {
      console.log('\n🚀 Запуск финальных многопользовательских тестов...');
      main().catch(console.error);
    } else {
      console.log('\n❌ Тестирование отменено из-за недоступности серверов');
      process.exit(1);
    }
  });
}

module.exports = { FinalMultiUserTester }; 