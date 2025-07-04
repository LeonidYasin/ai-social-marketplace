const { IntelligentOCRBot } = require('./intelligent_ocr_bot');

class IntelligentBotTester {
    constructor() {
        this.bot = null;
        this.results = [];
    }

    async initialize() {
        console.log('🚀 Инициализация тестера интеллектуального бота...');
        
        this.bot = new IntelligentOCRBot();
        await this.bot.init(1); // Инициализируем с 1 браузером
        console.log('✅ Интеллектуальный бот инициализирован');
    }

    async runStateAnalysisTest() {
        console.log('\n🧠 Запуск теста анализа состояния...');
        
        const scenario = {
            name: 'Тест анализа состояния приложения',
            description: 'Демонстрация интеллектуального анализа состояния приложения',
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
                    action: 'analyze_state',
                    browserIndex: 0,
                    description: 'Анализ начального состояния'
                },
                {
                    action: 'click',
                    browserIndex: 0,
                    text: 'гость',
                    description: 'вход в приложение'
                },
                {
                    action: 'wait_for_state',
                    browserIndex: 0,
                    targetState: 'Гостевой пользователь вошел',
                    timeout: 10000,
                    description: 'ожидание перехода в состояние гостевого пользователя'
                },
                {
                    action: 'analyze_state',
                    browserIndex: 0,
                    description: 'Анализ состояния после входа'
                },
                {
                    action: 'verify',
                    browserIndex: 0,
                    text: 'пост',
                    description: 'проверка наличия постов в ленте'
                },
                {
                    action: 'click',
                    browserIndex: 0,
                    text: 'создать',
                    description: 'создание поста',
                    required: false
                },
                {
                    action: 'wait_for_state',
                    browserIndex: 0,
                    targetState: 'Создание поста',
                    timeout: 5000,
                    description: 'ожидание перехода в состояние создания поста',
                    required: false
                }
            ]
        };

        try {
            const result = await this.bot.runIntelligentScenario(scenario);
            this.results.push({
                scenario: scenario.name,
                success: result.success,
                steps: result.steps,
                stateTransitions: result.stateTransitions,
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

    async runMultiStateTest() {
        console.log('\n🔄 Запуск теста множественных состояний...');
        
        const scenario = {
            name: 'Тест множественных состояний',
            description: 'Тестирование переходов между различными состояниями приложения',
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
                    action: 'analyze_state',
                    browserIndex: 0,
                    description: 'Анализ начального состояния'
                },
                {
                    action: 'click',
                    browserIndex: 0,
                    text: 'гость',
                    description: 'вход в приложение'
                },
                {
                    action: 'wait_for_state',
                    browserIndex: 0,
                    targetState: 'Гостевой пользователь вошел',
                    timeout: 10000,
                    description: 'ожидание входа'
                },
                {
                    action: 'analyze_state',
                    browserIndex: 0,
                    description: 'Анализ состояния гостевого пользователя'
                },
                {
                    action: 'verify',
                    browserIndex: 0,
                    text: 'чат',
                    description: 'проверка наличия кнопки чата',
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
                    action: 'wait_for_state',
                    browserIndex: 0,
                    targetState: 'Чат открыт',
                    timeout: 5000,
                    description: 'ожидание открытия чата',
                    required: false
                },
                {
                    action: 'analyze_state',
                    browserIndex: 0,
                    description: 'Анализ состояния чата'
                }
            ]
        };

        try {
            const result = await this.bot.runIntelligentScenario(scenario);
            this.results.push({
                scenario: scenario.name,
                success: result.success,
                steps: result.steps,
                stateTransitions: result.stateTransitions,
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

    generateIntelligentReport() {
        console.log('\n📊 ГЕНЕРАЦИЯ ИНТЕЛЛЕКТУАЛЬНОГО ОТЧЕТА');
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
                
                // Показываем переходы состояний
                if (result.stateTransitions && result.stateTransitions.length > 0) {
                    console.log(`   🔄 Переходы состояний:`);
                    result.stateTransitions.forEach(transition => {
                        console.log(`      ${transition.from} → ${transition.to} (шаг ${transition.step})`);
                    });
                }
                
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
        const reportPath = './test_logs/intelligent_bot_report.json';
        
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
            
            console.log('\n🎯 ЗАПУСК ИНТЕЛЛЕКТУАЛЬНЫХ ТЕСТОВ');
            console.log('=' .repeat(60));
            
            // Тест 1: Анализ состояния
            const stateResult = await this.runStateAnalysisTest();
            if (!stateResult.success) {
                console.log('\n⚠️ Тест анализа состояния не прошел. Останавливаем выполнение.');
                this.generateIntelligentReport();
                return;
            }
            
            // Пауза между тестами
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Тест 2: Множественные состояния
            const multiStateResult = await this.runMultiStateTest();
            if (!multiStateResult.success) {
                console.log('\n⚠️ Тест множественных состояний не прошел. Останавливаем выполнение.');
                this.generateIntelligentReport();
                return;
            }
            
            // Генерация интеллектуального отчета
            await this.bot.generateIntelligentReport();
            this.generateIntelligentReport();
            
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
    const tester = new IntelligentBotTester();
    await tester.runAllTests();
}

// Запуск с проверкой серверов
if (require.main === module) {
    checkServers().then(serversOk => {
        if (serversOk) {
            console.log('\n🚀 Запуск интеллектуальных тестов...');
            main().catch(console.error);
        } else {
            console.log('\n❌ Тестирование отменено из-за недоступности серверов');
            process.exit(1);
        }
    });
}

module.exports = { IntelligentBotTester }; 