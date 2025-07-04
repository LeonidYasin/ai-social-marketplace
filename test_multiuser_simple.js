const { OCRMasterBot } = require('./ocr_master_bot');

class SimpleMultiUserTester {
  constructor() {
    this.bot = null;
    this.results = [];
  }

  async initialize() {
    console.log('🚀 Инициализация упрощенного многопользовательского тестера...');
    
    this.bot = new OCRMasterBot();
    await this.bot.init(2); // Инициализируем с 2 браузерами для симуляции 2 пользователей
    console.log('✅ Бот инициализирован с 2 браузерами');
  }

  async runBasicTest() {
    console.log('\n📋 Запуск базового многопользовательского теста...');
    
    const scenario = {
      name: 'Базовый многопользовательский тест',
      description: 'Тестирование входа двух пользователей и их взаимодействия',
      steps: [
        {
          action: 'navigate',
          url: 'http://localhost:3000',
          description: 'Открытие приложения в двух браузерах'
        },
        {
          action: 'wait',
          duration: 3000,
          description: 'Ожидание загрузки'
        },
        // Вход первого пользователя
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'для входа первого пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа первого пользователя'
        },
        // Вход второго пользователя
        {
          action: 'click',
          browserIndex: 1,
          text: 'гость',
          description: 'для входа второго пользователя'
        },
        {
          action: 'waitFor',
          browserIndex: 1,
          text: 'пост',
          timeout: 10000,
          description: 'ожидание входа второго пользователя'
        },
        // Создание поста первым пользователем
        {
          action: 'click',
          browserIndex: 0,
          text: 'создать',
          description: 'создание поста первым пользователем',
          required: false
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'отправить',
          timeout: 5000,
          description: 'форма создания поста',
          required: false
        },
        // Проверка видимости пользователей
        {
          action: 'verify',
          browserIndex: 0,
          text: 'пользователь',
          description: 'в сайдбаре первого браузера',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 1,
          text: 'пользователь',
          description: 'в сайдбаре второго браузера',
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
      console.error(`❌ Критическая ошибка в сценарии "${scenario.name}":`, error.message);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runPostInteractionTest() {
    console.log('\n📝 Запуск теста взаимодействия с постами...');
    
    const scenario = {
      name: 'Тест взаимодействия с постами',
      description: 'Создание поста и добавление реакций',
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
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'для гостевого входа'
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
          text: 'создать',
          description: 'кнопка создания поста',
          required: false
        },
        {
          action: 'click',
          browserIndex: 0,
          text: 'создать',
          description: 'для создания поста',
          required: false
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'отправить',
          timeout: 5000,
          description: 'форма создания поста',
          required: false
        },
        {
          action: 'verify',
          browserIndex: 0,
          text: 'нравится',
          description: 'кнопка лайка',
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
      console.error(`❌ Критическая ошибка в сценарии "${scenario.name}":`, error.message);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runChatTest() {
    console.log('\n💬 Запуск теста чата...');
    
    const scenario = {
      name: 'Тест чата',
      description: 'Открытие чата и проверка функциональности',
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
        {
          action: 'click',
          browserIndex: 0,
          text: 'гость',
          description: 'для гостевого входа'
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
          text: 'чат',
          description: 'кнопка чата',
          required: false
        },
        {
          action: 'click',
          browserIndex: 0,
          text: 'чат',
          description: 'открытие чата',
          required: false
        },
        {
          action: 'waitFor',
          browserIndex: 0,
          text: 'онлайн',
          timeout: 5000,
          description: 'список онлайн пользователей',
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
      console.error(`❌ Критическая ошибка в сценарии "${scenario.name}":`, error.message);
      this.results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  generateReport() {
    console.log('\n📊 ГЕНЕРАЦИЯ ОТЧЕТА О ТЕСТИРОВАНИИ');
    console.log('=' .repeat(50));
    
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
      console.log(`${status} ${result.scenario}`);
      
      if (!result.success && result.error) {
        console.log(`   Ошибка: ${result.error}`);
      }
      
      if (result.steps) {
        const successfulSteps = result.steps.filter(s => s.success).length;
        console.log(`   Шагов выполнено: ${successfulSteps}/${result.steps.length}`);
      }
    });
    
    // Сохранение отчета в файл
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: (successfulTests / totalTests) * 100
      },
      results: this.results
    };
    
    const fs = require('fs');
    const reportPath = './test_logs/simple_multiuser_report.json';
    
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
      
      console.log('\n🎯 ЗАПУСК УПРОЩЕННЫХ МНОГОПОЛЬЗОВАТЕЛЬСКИХ ТЕСТОВ');
      console.log('=' .repeat(60));
      
      // Тест 1: Базовый многопользовательский тест
      const basicResult = await this.runBasicTest();
      if (!basicResult.success) {
        console.log('\n⚠️ Базовый тест не прошел. Останавливаем выполнение.');
        this.generateReport();
        return;
      }
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 2: Взаимодействие с постами
      const postResult = await this.runPostInteractionTest();
      if (!postResult.success) {
        console.log('\n⚠️ Тест взаимодействия с постами не прошел. Останавливаем выполнение.');
        this.generateReport();
        return;
      }
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Тест 3: Тест чата
      const chatResult = await this.runChatTest();
      if (!chatResult.success) {
        console.log('\n⚠️ Тест чата не прошел. Останавливаем выполнение.');
        this.generateReport();
        return;
      }
      
      // Генерация отчета
      this.generateReport();
      
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
  const tester = new SimpleMultiUserTester();
  await tester.runAllTests();
}

// Запуск с проверкой серверов
if (require.main === module) {
  checkServers().then(serversOk => {
    if (serversOk) {
      console.log('\n🚀 Запуск упрощенных многопользовательских тестов...');
      main().catch(console.error);
    } else {
      console.log('\n❌ Тестирование отменено из-за недоступности серверов');
      process.exit(1);
    }
  });
}

module.exports = { SimpleMultiUserTester }; 