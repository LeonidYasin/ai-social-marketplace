const FinalOCRBot = require('./final_ocr_bot');

class TestFinalOCRBot {
    constructor() {
        this.bot = new FinalOCRBot();
    }

    async runBasicTests() {
        try {
            console.log('🎯 Запуск базовых тестов финального OCR бота...');
            
            await this.bot.init();
            
            // Переходим на страницу приложения
            await this.bot.page.goto(this.bot.baseUrl);
            await this.bot.pause(3000);
            
            // Тест 1: Анализ состояния
            console.log('\n📱 Тест 1: Анализ состояния');
            const state = await this.bot.analyzeCurrentState();
            console.log('Результат:', state);
            
            // Тест 2: Создание поста
            console.log('\n✏️ Тест 2: Создание поста');
            const createPostResult = await this.bot.createPost();
            console.log('Результат:', createPostResult ? '✅' : '❌');
            
            // Тест 3: Лайк поста
            console.log('\n👍 Тест 3: Лайк поста');
            const likeResult = await this.bot.likePost();
            console.log('Результат:', likeResult ? '✅' : '❌');
            
            // Тест 4: Открытие чата
            console.log('\n💬 Тест 4: Открытие чата');
            const chatResult = await this.bot.sendMessage();
            console.log('Результат:', chatResult ? '✅' : '❌');
            
            // Тест 5: Открытие меню
            console.log('\n📋 Тест 5: Открытие меню');
            const menuResult = await this.bot.openMenu();
            console.log('Результат:', menuResult ? '✅' : '❌');
            
            // Генерация отчета
            const report = await this.bot.generateReport();
            
            console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ:');
            console.log('=' * 50);
            console.log(`Всего действий: ${report.summary.totalActions}`);
            console.log(`Ошибок: ${report.summary.errors}`);
            console.log(`Предупреждений: ${report.summary.warnings}`);
            console.log(`Успешных действий: ${report.summary.success}`);
            
            const successRate = (report.summary.success / report.summary.totalActions * 100).toFixed(1);
            console.log(`Процент успеха: ${successRate}%`);
            
            if (successRate >= 80) {
                console.log('🎉 OCR бот работает отлично!');
            } else if (successRate >= 60) {
                console.log('👍 OCR бот работает хорошо');
            } else {
                console.log('⚠️ OCR бот требует доработки');
            }
            
        } catch (error) {
            console.error('❌ Ошибка при выполнении тестов:', error);
            this.bot.addError('Критическая ошибка при выполнении тестов', error);
        } finally {
            this.bot.handleFinalErrors();
            await this.bot.cleanup();
        }
    }

    async runScenarioTests() {
        try {
            console.log('🎬 Запуск тестов сценариев...');
            
            await this.bot.init();
            
            // Сценарий 1: Базовое взаимодействие
            const basicScenario = {
                name: 'Базовое взаимодействие',
                steps: [
                    { description: 'Анализ состояния', action: 'analyze_state', delay: 2000 },
                    { description: 'Создание поста', action: 'create_post', delay: 3000 },
                    { description: 'Лайк поста', action: 'like_post', delay: 2000 }
                ]
            };
            
            console.log('\n🎬 Сценарий 1: Базовое взаимодействие');
            const scenario1Result = await this.bot.runScenario(basicScenario);
            console.log('Результат:', scenario1Result ? '✅' : '❌');
            
            // Сценарий 2: Навигация
            const navigationScenario = {
                name: 'Навигация',
                steps: [
                    { description: 'Открытие чата', action: 'send_message', delay: 2000 },
                    { description: 'Открытие меню', action: 'open_menu', delay: 2000 }
                ]
            };
            
            console.log('\n🎬 Сценарий 2: Навигация');
            const scenario2Result = await this.bot.runScenario(navigationScenario);
            console.log('Результат:', scenario2Result ? '✅' : '❌');
            
            console.log('\n📊 РЕЗУЛЬТАТЫ СЦЕНАРИЕВ:');
            console.log(`Сценарий 1: ${scenario1Result ? '✅' : '❌'}`);
            console.log(`Сценарий 2: ${scenario2Result ? '✅' : '❌'}`);
            
            const successCount = [scenario1Result, scenario2Result].filter(Boolean).length;
            console.log(`Успешных сценариев: ${successCount}/2`);
            
        } catch (error) {
            console.error('❌ Ошибка при выполнении сценариев:', error);
            this.bot.addError('Критическая ошибка при выполнении сценариев', error);
        } finally {
            this.bot.handleFinalErrors();
            await this.bot.cleanup();
        }
    }

    async runMultiuserTest() {
        try {
            console.log('👥 Запуск многопользовательского теста...');
            
            await this.bot.init();
            
            const multiuserResult = await this.bot.runMultiuserTest();
            
            console.log('\n📊 РЕЗУЛЬТАТ МНОГОПОЛЬЗОВАТЕЛЬСКОГО ТЕСТА:');
            console.log(`Результат: ${multiuserResult ? '✅' : '❌'}`);
            
            if (multiuserResult) {
                console.log('🎉 Многопользовательский тест прошел успешно!');
            } else {
                console.log('⚠️ Многопользовательский тест требует доработки');
            }
            
        } catch (error) {
            console.error('❌ Ошибка в многопользовательском тесте:', error);
            this.bot.addError('Критическая ошибка в многопользовательском тесте', error);
        } finally {
            this.bot.handleFinalErrors();
            await this.bot.cleanup();
        }
    }

    async runAllTests() {
        try {
            console.log('🎯 ЗАПУСК ВСЕХ ТЕСТОВ ФИНАЛЬНОГО OCR БОТА');
            console.log('=' * 60);
            
            // Базовые тесты
            await this.runBasicTests();
            
            console.log('\n' + '=' * 60);
            
            // Тесты сценариев
            await this.runScenarioTests();
            
            console.log('\n' + '=' * 60);
            
            // Многопользовательский тест
            await this.runMultiuserTest();
            
            console.log('\n🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!');
            
        } catch (error) {
            console.error('❌ Критическая ошибка:', error);
            this.bot.addError('Критическая ошибка при выполнении всех тестов', error);
        }
    }
}

// Запуск тестов
if (require.main === module) {
    const tester = new TestFinalOCRBot();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--basic')) {
        tester.runBasicTests();
    } else if (args.includes('--scenarios')) {
        tester.runScenarioTests();
    } else if (args.includes('--multiuser')) {
        tester.runMultiuserTest();
    } else {
        tester.runAllTests();
    }
}

module.exports = TestFinalOCRBot; 