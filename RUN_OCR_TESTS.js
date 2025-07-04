#!/usr/bin/env node

/**
 * Основной файл для запуска OCR тестов
 * Использование: node RUN_OCR_TESTS.js [опции]
 */

const OCRBot = require('./OCR_BOT_IMPLEMENTATION');
const testScenarios = require('./TEST_SCENARIOS');
const path = require('path');

// Парсинг аргументов командной строки
const args = process.argv.slice(2);
const options = {
  device: 'desktop',
  scenarios: 'all',
  headless: false,
  slowMo: 100,
  output: 'reports'
};

// Обработка аргументов
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--device':
      options.device = args[++i];
      break;
    case '--scenarios':
      options.scenarios = args[++i];
      break;
    case '--headless':
      options.headless = true;
      break;
    case '--slow':
      options.slowMo = parseInt(args[++i]) || 200;
      break;
    case '--output':
      options.output = args[++i];
      break;
    case '--help':
      showHelp();
      process.exit(0);
      break;
  }
}

function showHelp() {
  console.log(`
OCR Bot - Универсальный тестирующий модуль

Использование: node RUN_OCR_TESTS.js [опции]

Опции:
  --device <device>     Устройство для тестирования (desktop, mobile) [по умолчанию: desktop]
  --scenarios <type>    Тип сценариев (all, basic, advanced, multiuser, auth, post, chat) [по умолчанию: all]
  --headless           Запуск в фоновом режиме
  --slow <ms>          Замедление действий в миллисекундах [по умолчанию: 100]
  --output <path>      Путь для сохранения отчетов [по умолчанию: reports]
  --help               Показать эту справку

Примеры:
  node RUN_OCR_TESTS.js --device mobile --scenarios basic
  node RUN_OCR_TESTS.js --headless --scenarios auth
  node RUN_OCR_TESTS.js --slow 200 --scenarios all
`);
}

// Выбор сценариев для выполнения
function getScenariosToRun() {
  switch (options.scenarios) {
    case 'all':
      return testScenarios.allScenarios;
    case 'basic':
      return testScenarios.basicScenarios;
    case 'advanced':
      return testScenarios.advancedScenarios;
    case 'multiuser':
      return testScenarios.multiuserScenarios;
    case 'auth':
      return [testScenarios.authScenario];
    case 'post':
      return [testScenarios.createPostScenario];
    case 'chat':
      return [testScenarios.chatScenario, testScenarios.sendMessageScenario];
    default:
      console.log(`❌ Неизвестный тип сценариев: ${options.scenarios}`);
      console.log('Доступные типы: all, basic, advanced, multiuser, auth, post, chat');
      process.exit(1);
  }
}

// Основная функция запуска тестов
async function runTests() {
  console.log('🚀 Запуск OCR тестов');
  console.log(`📱 Устройство: ${options.device}`);
  console.log(`🎬 Сценарии: ${options.scenarios}`);
  console.log(`👻 Headless: ${options.headless}`);
  console.log(`🐌 Замедление: ${options.slowMo}ms`);
  console.log(`📁 Отчеты: ${options.output}`);
  console.log('');

  const bot = new OCRBot({
    browser: {
      headless: options.headless,
      slowMo: options.slowMo
    },
    devices: {
      desktop: { width: 1920, height: 1080 },
      mobile: { width: 375, height: 667 }
    }
  });

  try {
    // Инициализация бота
    await bot.init(options.device);
    console.log('✅ Бот инициализирован');

    // Получение сценариев для выполнения
    const scenarios = getScenariosToRun();
    console.log(`📋 Найдено сценариев для выполнения: ${scenarios.length}`);

    // Выполнение сценариев
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      console.log(`\n🎬 [${i + 1}/${scenarios.length}] Выполнение сценария: ${scenario.name}`);
      
      const result = await bot.runScenario(scenario);
      
      if (result.status === 'passed') {
        console.log(`✅ Сценарий "${scenario.name}" выполнен успешно`);
      } else {
        console.log(`❌ Сценарий "${scenario.name}" провалился`);
        console.log(`   Ошибки: ${result.errors.join(', ')}`);
      }
    }

    // Генерация отчета
    console.log('\n📊 Генерация отчета...');
    const report = await bot.generateReport();
    
    // Вывод итоговой статистики
    console.log('\n📈 Итоговая статистика:');
    console.log(`   Всего сценариев: ${report.summary.totalScenarios}`);
    console.log(`   Успешно: ${report.summary.passedScenarios}`);
    console.log(`   Провалилось: ${report.summary.failedScenarios}`);
    console.log(`   Всего шагов: ${report.summary.totalSteps}`);
    console.log(`   Успешных шагов: ${report.summary.passedSteps}`);
    console.log(`   Провалившихся шагов: ${report.summary.failedSteps}`);
    
    if (report.summary.failedScenarios > 0) {
      console.log('\n⚠️  Найдены проблемы:');
      report.errors.forEach(error => {
        console.log(`   - ${error.step || 'Unknown'}: ${error.error}`);
      });
      
      console.log('\n💡 Рекомендации:');
      report.recommendations.forEach(rec => {
        console.log(`   - ${rec.message} (Приоритет: ${rec.priority})`);
      });
      
      process.exit(1); // Выход с ошибкой если есть провалившиеся тесты
    } else {
      console.log('\n🎉 Все тесты прошли успешно!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Критическая ошибка при выполнении тестов:', error);
    process.exit(1);
  } finally {
    // Очистка ресурсов
    await bot.cleanup();
    console.log('🔒 Ресурсы очищены');
  }
}

// Запуск тестов если файл выполняется напрямую
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Неожиданная ошибка:', error);
    process.exit(1);
  });
}

module.exports = { runTests, options }; 