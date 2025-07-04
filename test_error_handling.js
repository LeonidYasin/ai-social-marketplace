const { OCRMasterBot } = require('./ocr_master_bot');

class ErrorHandlingTester {
  constructor() {
    this.bot = null;
    this.results = [];
  }

  async initialize() {
    console.log('🚀 Инициализация тестера обработки ошибок...');
    
    this.bot = new OCRMasterBot();
    await this.bot.init(1); // Инициализируем с 1 браузером
    console.log('✅ Бот инициализирован');
  }

  async runErrorTest() {
    console.log('\n🧪 Запуск теста обработки ошибок...');
    
    // Сценарий с намеренной ошибкой для демонстрации
    const scenario = {
      name: 'Тест обработки ошибок',
      description: 'Демонстрация остановки при обнаружении ошибки',
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
        // Этот шаг должен пройти успешно
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'вход в приложение'
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание загрузки ленты'
        },
        // Этот шаг должен вызвать ошибку и остановить выполнение
        {
          action: 'click',
          browserIndex: 0,
          text: 'несуществующий_элемент',
          description: 'попытка клика по несуществующему элементу'
        },
        // Этот шаг не должен выполниться из-за ошибки выше
        {
          action: 'verify',
          browserIndex: 0,
          text: 'пост',
          description: 'проверка наличия постов (не выполнится)'
        }
      ]
    };

    try {
      const result = await this.bot.runScenario(scenario);
      this.results.push({
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        error: result.error
      });
      
      console.log(`✅ Сценарий "${scenario.name}" завершен`);
      return result;
    } catch (error) {
      console.error(`❌ Критическая ошибка в сценарии "${scenario.name}":`, error.message);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runTimeoutTest() {
    console.log('\n⏰ Запуск теста таймаута...');
    
    const scenario = {
      name: 'Тест таймаута',
      description: 'Демонстрация остановки при таймауте',
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
        // Этот шаг должен пройти успешно
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'вход в приложение'
        },
        // Этот шаг должен вызвать таймаут и остановить выполнение
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'несуществующий_текст',
          timeout: 5000,
          description: 'ожидание несуществующего текста (таймаут)'
        },
        // Этот шаг не должен выполниться из-за таймаута выше
        {
          action: 'verify',
          browserIndex: 0,
          text: 'пост',
          description: 'проверка наличия постов (не выполнится)'
        }
      ]
    };

    try {
      const result = await this.bot.runScenario(scenario);
      this.results.push({
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        error: result.error
      });
      
      console.log(`✅ Сценарий "${scenario.name}" завершен`);
      return result;
    } catch (error) {
      console.error(`❌ Критическая ошибка в сценарии "${scenario.name}":`, error.message);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runNonCriticalErrorTest() {
    console.log('\n⚠️ Запуск теста некритических ошибок...');
    
    const scenario = {
      name: 'Тест некритических ошибок',
      description: 'Демонстрация продолжения выполнения при некритических ошибках',
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
        // Этот шаг должен пройти успешно
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'вход в приложение'
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание загрузки ленты'
        },
        // Этот шаг должен вызвать ошибку, но не остановить выполнение (required: false)
        {
          action: 'verify',
          browserIndex: 0,
          text: 'несуществующий_элемент',
          description: 'проверка несуществующего элемента (некритично)',
          required: false
        },
        // Этот шаг должен выполниться, несмотря на ошибку выше
        {
          action: 'verify',
          browserIndex: 0,
          text: 'пост',
          description: 'проверка наличия постов (должен выполниться)'
        }
      ]
    };

    try {
      const result = await this.bot.runScenario(scenario);
      this.results.push({
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        error: result.error
      });
      
      console.log(`✅ Сценарий "${scenario.name}" завершен`);
      return result;
    } catch (error) {
      console.error(`❌ Критическая ошибка в сценарии "${scenario.name}":`, error.message);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  generateErrorReport() {
    console.log('\n📊 ГЕНЕРАЦИЯ ОТЧЕТА ОБ ОБРАБОТКЕ ОШИБОК');
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
        console.log(`   📊 Шагов выполнено: ${successfulSteps}/${totalSteps}`);
        
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
    });
    
    // Анализ типов ошибок
    console.log('\n🔍 АНАЛИЗ ТИПОВ ОШИБОК:');
    const allSteps = this.results.flatMap(r => r.steps || []);
    const failedSteps = allSteps.filter(s => !s.success);
    
    if (failedSteps.length > 0) {
      const errorTypes = {};
      failedSteps.forEach(step => {
        if (step.error) {
          let errorType = 'неизвестная ошибка';
          if (step.error.includes('не найден')) errorType = 'элемент не найден';
          else if (step.error.includes('таймаут')) errorType = 'таймаут';
          else if (step.error.includes('клик')) errorType = 'ошибка клика';
          
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        }
      });
      
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} раз`);
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
      errorAnalysis: failedSteps.length > 0 ? {
        totalFailedSteps: failedSteps.length,
        errorTypes: failedSteps.reduce((acc, step) => {
          if (step.error) {
            let errorType = 'неизвестная ошибка';
            if (step.error.includes('не найден')) errorType = 'элемент не найден';
            else if (step.error.includes('таймаут')) errorType = 'таймаут';
            else if (step.error.includes('клик')) errorType = 'ошибка клика';
            
            acc[errorType] = (acc[errorType] || 0) + 1;
          }
          return acc;
        }, {})
      } : null
    };
    
    const fs = require('fs');
    const reportPath = './test_logs/error_handling_report.json';
    
    if (!fs.existsSync('./test_logs')) {
      fs.mkdirSync('./test_logs', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Отчет сохранен в: ${reportPath}`);
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
      
      console.log('\n🎯 ЗАПУСК ТЕСТОВ ОБРАБОТКИ ОШИБОК');
      console.log('=' .repeat(60));
      
      // Тест 1: Критическая ошибка (должен остановить выполнение)
      console.log('\n🧪 ТЕСТ 1: Критическая ошибка');
      console.log('Ожидаемый результат: Остановка при первой ошибке');
      const errorResult = await this.runErrorTest();
      
      if (!errorResult.success) {
        console.log('\n✅ Тест критической ошибки прошел успешно - выполнение остановлено');
        this.generateErrorReport();
        return;
      }
      
      // Тест 2: Таймаут (должен остановить выполнение)
      console.log('\n⏰ ТЕСТ 2: Таймаут');
      console.log('Ожидаемый результат: Остановка при таймауте');
      const timeoutResult = await this.runTimeoutTest();
      
      if (!timeoutResult.success) {
        console.log('\n✅ Тест таймаута прошел успешно - выполнение остановлено');
        this.generateErrorReport();
        return;
      }
      
      // Тест 3: Некритическая ошибка (должен продолжить выполнение)
      console.log('\n⚠️ ТЕСТ 3: Некритическая ошибка');
      console.log('Ожидаемый результат: Продолжение выполнения при некритических ошибках');
      const nonCriticalResult = await this.runNonCriticalErrorTest();
      
      // Генерация отчета
      this.generateErrorReport();
      
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
  const tester = new ErrorHandlingTester();
  await tester.runAllTests();
}

// Запуск с проверкой серверов
if (require.main === module) {
  checkServers().then(serversOk => {
    if (serversOk) {
      console.log('\n🚀 Запуск тестов обработки ошибок...');
      main().catch(console.error);
    } else {
      console.log('\n❌ Тестирование отменено из-за недоступности серверов');
      process.exit(1);
    }
  });
}

module.exports = { ErrorHandlingTester }; 