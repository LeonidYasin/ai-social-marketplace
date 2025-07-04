const { OCRMasterBot } = require('./ocr_master_bot');

class ComplexMultiUserTester {
  constructor() {
    this.bot = null;
    this.results = [];
  }

  async initialize() {
    console.log('🚀 Инициализация сложного многопользовательского тестера...');
    
    this.bot = new OCRMasterBot();
    await this.bot.init(3); // Инициализируем с 3 браузерами для симуляции 3 пользователей
    console.log('✅ Бот инициализирован с 3 браузерами');
  }

  async runUserRegistrationTest() {
    console.log('\n👤 Запуск теста регистрации пользователей...');
    
    const scenario = {
      name: 'Регистрация и вход пользователей',
      description: 'Тестирование регистрации и входа трех пользователей',
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
        // Регистрация первого пользователя
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'регистрация первого пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа первого пользователя'
        },
        // Регистрация второго пользователя
        {
          action: 'click',
          browserIndex: 1,
          text: 'гость',
          description: 'регистрация второго пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 1,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа второго пользователя'
        },
        // Регистрация третьего пользователя
        {
          action: 'click',
          browserIndex: 2,
          text: 'гость',
          description: 'регистрация третьего пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 2,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа третьего пользователя'
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

  async runPostCreationTest() {
    console.log('\n📝 Запуск теста создания постов...');
    
    const scenario = {
      name: 'Создание постов разными пользователями',
      description: 'Тестирование создания постов тремя пользователями',
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
        // Первый пользователь создает пост
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
        {
          action: 'verify',
          browserIndex: 0,
          text: 'нового',
          description: 'кнопка создания нового поста',
          required: false
        },
        // Второй пользователь создает пост
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
          action: 'verify',
          browserIndex: 1,
          text: 'нового',
          description: 'кнопка создания нового поста',
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
    console.log('\n💬 Запуск теста взаимодействия между пользователями...');
    
    const scenario = {
      name: 'Взаимодействие между пользователями',
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
        // Второй пользователь входит и лайкает
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
          action: 'verify',
          browserIndex: 1,
          text: 'нравится',
          description: 'кнопка лайка',
          required: false
        },
        // Третий пользователь входит и комментирует
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
          action: 'verify',
          browserIndex: 2,
          text: 'комментировать',
          description: 'кнопка комментария',
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

  async runRealTimeTest() {
    console.log('\n⚡ Запуск теста реального времени...');
    
    const scenario = {
      name: 'Тест реального времени',
      description: 'Тестирование синхронизации между пользователями в реальном времени',
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
        // Проверка синхронизации
        {
          action: 'verify',
          browserIndex: 0,
          text: 'онлайн',
          description: 'проверка онлайн статуса',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 1,
          text: 'онлайн',
          description: 'проверка онлайн статуса',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 2,
          text: 'онлайн',
          description: 'проверка онлайн статуса',
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
      description: 'Тестирование производительности при одновременной работе нескольких пользователей',
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

  generateDetailedReport() {
    console.log('\n📊 ГЕНЕРАЦИЯ ДЕТАЛЬНОГО ОТЧЕТА О ТЕСТИРОВАНИИ');
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
      } : null
    };
    
    const fs = require('fs');
    const reportPath = './test_logs/complex_multiuser_report.json';
    
    if (!fs.existsSync('./test_logs')) {
      fs.mkdirSync('./test_logs', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Детальный отчет сохранен в: ${reportPath}`);
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
      
      console.log('\n🎯 ЗАПУСК СЛОЖНЫХ МНОГОПОЛЬЗОВАТЕЛЬСКИХ ТЕСТОВ');
      console.log('=' .repeat(60));
      
      // Тест 1: Регистрация пользователей
      await this.runUserRegistrationTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 2: Создание постов
      await this.runPostCreationTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 3: Взаимодействие между пользователями
      await this.runInteractionTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 4: Реальное время
      await this.runRealTimeTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 5: Производительность
      await this.runPerformanceTest();
      
      // Генерация детального отчета
      this.generateDetailedReport();
      
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
  const tester = new ComplexMultiUserTester();
  await tester.runAllTests();
}

// Запуск с проверкой серверов
if (require.main === module) {
  checkServers().then(serversOk => {
    if (serversOk) {
      console.log('\n🚀 Запуск сложных многопользовательских тестов...');
      main().catch(console.error);
    } else {
      console.log('\n❌ Тестирование отменено из-за недоступности серверов');
      process.exit(1);
    }
  });
}

module.exports = { ComplexMultiUserTester }; 