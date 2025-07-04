// Используем встроенный fetch для Node.js v22+
// const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { OCRMasterBot } = require('./ocr_master_bot');
const { 
  complexMultiuserScenario, 
  multiuserChatScenario, 
  fullInteractionScenario, 
  notificationTestScenario,
  multiuserScenarios 
} = require('./TEST_SCENARIOS');

const API_BASE = 'http://localhost:8000/api';
const LOG_DIR = './test_logs';

// Создаем директорию для логов если её нет
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Расширенный логгер
class Logger {
  constructor(filename) {
    this.filename = path.join(LOG_DIR, filename);
    this.logs = [];
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

  save() {
    fs.writeFileSync(this.filename, this.logs.join('\n'));
  }
}

// Тестовые пользователи с разными ролями
const testUsers = [
  {
    username: 'admin_user',
    email: 'admin@test.com',
    password: 'admin123',
    first_name: 'Админ',
    last_name: 'Тестовый',
    role: 'admin'
  },
  {
    username: 'moderator_user',
    email: 'moderator@test.com',
    password: 'mod123',
    first_name: 'Модератор',
    last_name: 'Тестовый',
    role: 'moderator'
  },
  {
    username: 'regular_user1',
    email: 'user1@test.com',
    password: 'user123',
    first_name: 'Обычный',
    last_name: 'Пользователь 1',
    role: 'user'
  },
  {
    username: 'regular_user2',
    email: 'user2@test.com',
    password: 'user123',
    first_name: 'Обычный',
    last_name: 'Пользователь 2',
    role: 'user'
  },
  {
    username: 'premium_user',
    email: 'premium@test.com',
    password: 'premium123',
    first_name: 'Премиум',
    last_name: 'Пользователь',
    role: 'premium'
  }
];

// Тестовые данные для постов
const testPosts = [
  {
    content: 'Первый тестовый пост от пользователя 1! 🎉',
    privacy: 'public',
    section: 'general'
  },
  {
    content: 'Второй пост с медиа контентом 📸',
    privacy: 'public',
    section: 'general',
    media_urls: ['https://via.placeholder.com/300x200'],
    media_type: 'image'
  },
  {
    content: 'Приватный пост только для друзей 🔒',
    privacy: 'friends',
    section: 'personal'
  },
  {
    content: 'Пост в разделе новостей 📰',
    privacy: 'public',
    section: 'news'
  },
  {
    content: 'Пост с AI генерацией 🤖',
    privacy: 'public',
    section: 'general',
    is_ai_generated: true,
    ai_prompt: 'Создай интересный пост о технологиях'
  }
];

// Тестовые комментарии
const testComments = [
  'Отличный пост! 👍',
  'Согласен с автором!',
  'Интересная мысль 🤔',
  'Спасибо за информацию!',
  'Хотелось бы узнать больше...'
];

// Тестовые реакции
const testReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

class AdvancedMultiUserTester {
  constructor() {
    this.bots = [];
    this.results = [];
  }

  async initialize() {
    console.log('🚀 Инициализация расширенного многопользовательского тестера...');
    
    // Создаем несколько ботов для симуляции разных пользователей
    for (let i = 1; i <= 3; i++) {
      const bot = new OCRMasterBot();
      
      await bot.init(1); // Инициализируем с одним браузером для каждого бота
      this.bots.push(bot);
      console.log(`✅ Бот ${i} инициализирован`);
    }
  }

  async runScenario(bot, scenario, botIndex) {
    console.log(`\n📋 Запуск сценария "${scenario.name}" для бота ${botIndex + 1}`);
    
    try {
      // Адаптируем сценарий под OCRMasterBot
      const adaptedScenario = {
        name: scenario.name,
        description: scenario.name,
        steps: scenario.steps.map(step => ({
          action: 'navigate',
          url: scenario.startUrl,
          description: 'Открытие страницы'
        })).concat(scenario.steps.map(step => ({
          action: step.action ? 'click' : 'wait',
          browserIndex: 0,
          text: step.expected,
          description: step.name,
          duration: step.wait || 1000
        })))
      };
      
      const result = await bot.runScenario(adaptedScenario);
      this.results.push({
        botIndex: botIndex + 1,
        scenario: scenario.name,
        success: result.success,
        steps: result.steps,
        errors: result.errors
      });
      
      console.log(`✅ Сценарий "${scenario.name}" для бота ${botIndex + 1} завершен`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка в сценарии "${scenario.name}" для бота ${botIndex + 1}:`, error);
      this.results.push({
        botIndex: botIndex + 1,
        scenario: scenario.name,
        success: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async runParallelScenarios() {
    console.log('\n🔄 Запуск параллельных сценариев...');
    
    const scenarios = [
      { scenario: complexMultiuserScenario, botIndex: 0 },
      { scenario: multiuserChatScenario, botIndex: 1 },
      { scenario: notificationTestScenario, botIndex: 2 }
    ];

    const promises = scenarios.map(({ scenario, botIndex }) => 
      this.runScenario(this.bots[botIndex], scenario, botIndex)
    );

    await Promise.all(promises);
  }

  async runSequentialScenarios() {
    console.log('\n📝 Запуск последовательных сценариев...');
    
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      const scenario = fullInteractionScenario;
      
      await this.runScenario(bot, scenario, i);
      
      // Пауза между пользователями
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  async runInteractionTest() {
    console.log('\n💬 Тест взаимодействия между пользователями...');
    
    // Бот 1 создает пост
    await this.runScenario(this.bots[0], {
      name: 'Create Post for Interaction',
      startUrl: 'http://localhost:3000',
      steps: [
        {
          name: 'Создание поста',
          action: async (bot) => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await bot.clickText('Создать пост');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await bot.typeText('пост', 'Пост для взаимодействия между пользователями - ' + new Date().toLocaleString());
            await bot.clickText('Опубликовать');
            await new Promise(resolve => setTimeout(resolve, 2000));
          },
          expected: 'Пост для взаимодействия между пользователями',
          wait: 1000
        }
      ]
    }, 0);

    // Бот 2 лайкает пост
    await this.runScenario(this.bots[1], {
      name: 'Like Post from Another User',
      startUrl: 'http://localhost:3000',
      steps: [
        {
          name: 'Ожидание загрузки и лайк',
          action: async (bot) => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await bot.clickText('Нравится');
            await new Promise(resolve => setTimeout(resolve, 1000));
          },
          expected: '1',
          wait: 1000
        }
      ]
    }, 1);

    // Бот 3 комментирует пост
    await this.runScenario(this.bots[2], {
      name: 'Comment on Post from Another User',
      startUrl: 'http://localhost:3000',
      steps: [
        {
          name: 'Добавление комментария',
          action: async (bot) => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await bot.clickText('Комментировать');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await bot.typeText('комментарий', 'Отличный пост! Комментарий от третьего пользователя');
            await bot.clickText('Отправить');
            await new Promise(resolve => setTimeout(resolve, 2000));
          },
          expected: 'Отличный пост! Комментарий от третьего пользователя',
          wait: 1000
        }
      ]
    }, 2);
  }

  async runChatInteractionTest() {
    console.log('\n💬 Тест взаимодействия в чате...');
    
    // Все боты открывают чат
    const chatPromises = this.bots.map((bot, index) => 
      this.runScenario(bot, {
        name: 'Open Chat for Interaction',
        startUrl: 'http://localhost:3000',
        steps: [
          {
            name: 'Открытие чата',
            action: async (bot) => {
              await new Promise(resolve => setTimeout(resolve, 3000));
              await bot.clickText('Чат');
              await new Promise(resolve => setTimeout(resolve, 2000));
            },
            expected: 'онлайн',
            wait: 1000
          }
        ]
      }, index)
    );

    await Promise.all(chatPromises);

    // Боты отправляют сообщения по очереди
    for (let i = 0; i < this.bots.length; i++) {
      await this.runScenario(this.bots[i], {
        name: `Send Message from Bot ${i + 1}`,
        startUrl: 'http://localhost:3000',
        steps: [
          {
            name: 'Отправка сообщения',
            action: async (bot) => {
              await bot.clickText('пользователь');
              await new Promise(resolve => setTimeout(resolve, 1000));
              await bot.typeText('сообщение', `Сообщение от бота ${i + 1} - ${new Date().toLocaleString()}`);
              await bot.clickText('Отправить');
              await new Promise(resolve => setTimeout(resolve, 2000));
            },
            expected: `Сообщение от бота ${i + 1}`,
            wait: 1000
          }
        ]
      }, i);

      await new Promise(resolve => setTimeout(resolve, 2000));
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
      console.log(`${status} Бот ${result.botIndex} - ${result.scenario}`);
      
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
    const reportPath = './test_logs/advanced_multiuser_report.json';
    
    if (!fs.existsSync('./test_logs')) {
      fs.mkdirSync('./test_logs', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Отчет сохранен в: ${reportPath}`);
  }

  async cleanup() {
    console.log('\n🧹 Очистка ресурсов...');
    
    for (let i = 0; i < this.bots.length; i++) {
      if (this.bots[i]) {
        await this.bots[i].close();
        console.log(`✅ Бот ${i + 1} очищен`);
      }
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n🎯 ЗАПУСК РАСШИРЕННЫХ МНОГОПОЛЬЗОВАТЕЛЬСКИХ ТЕСТОВ');
      console.log('=' .repeat(60));
      
      // Тест 1: Параллельные сценарии
      await this.runParallelScenarios();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Тест 2: Последовательные сценарии
      await this.runSequentialScenarios();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Тест 3: Взаимодействие между пользователями
      await this.runInteractionTest();
      
      // Пауза между тестами
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Тест 4: Взаимодействие в чате
      await this.runChatInteractionTest();
      
      // Генерация отчета
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Критическая ошибка в тестировании:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Запуск тестов
async function main() {
  const tester = new AdvancedMultiUserTester();
  await tester.runAllTests();
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

// Запуск с проверкой серверов
if (require.main === module) {
  checkServers().then(serversOk => {
    if (serversOk) {
      console.log('\n🚀 Запуск расширенных многопользовательских тестов...');
      main().catch(console.error);
    } else {
      console.log('\n❌ Тестирование отменено из-за недоступности серверов');
      process.exit(1);
    }
  });
}

module.exports = { AdvancedMultiUserTester }; 