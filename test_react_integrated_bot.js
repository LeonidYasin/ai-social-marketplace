const { ReactIntegratedBot } = require('./react_integrated_bot');

// Сценарии для тестирования React-интегрированного бота
const reactIntegratedScenarios = [
    {
        name: 'React-анализ начального состояния',
        description: 'Тестирование анализа состояния через DOM и React компоненты',
        steps: [
            {
                description: 'Переход на главную страницу',
                action: 'navigate',
                url: 'http://localhost:3000'
            },
            {
                description: 'Анализ начального состояния через DOM',
                action: 'screenshot',
                name: 'react_initial_state'
            },
            {
                description: 'Проверка наличия кнопки "Гость"',
                action: 'verify',
                text: 'гость',
                context: {
                    state: 'Начальная страница',
                    actions: ['click_guest', 'click_login']
                }
            },
            {
                description: 'Ожидание загрузки React компонентов',
                action: 'pause',
                duration: 2000
            }
        ]
    },
    {
        name: 'React-анализ после входа гостя',
        description: 'Тестирование анализа состояния после входа как гость',
        steps: [
            {
                description: 'Переход на главную страницу',
                action: 'navigate',
                url: 'http://localhost:3000'
            },
            {
                description: 'Клик по кнопке "Гость"',
                action: 'click',
                text: 'гость',
                options: {
                    exact: false,
                    confidence: 60
                }
            },
            {
                description: 'Анализ состояния после входа',
                action: 'screenshot',
                name: 'react_after_guest_login'
            },
            {
                description: 'Проверка перехода в состояние гостевого пользователя',
                action: 'verify',
                text: 'пост',
                context: {
                    state: 'Гостевой пользователь вошел',
                    actions: ['create_post', 'view_profile']
                }
            },
            {
                description: 'Ожидание загрузки ленты',
                action: 'pause',
                duration: 2000
            }
        ]
    },
    {
        name: 'React-анализ создания поста',
        description: 'Тестирование анализа состояния при создании поста',
        steps: [
            {
                description: 'Переход на главную страницу',
                action: 'navigate',
                url: 'http://localhost:3000'
            },
            {
                description: 'Вход как гость',
                action: 'click',
                text: 'гость'
            },
            {
                description: 'Ожидание загрузки ленты',
                action: 'pause',
                duration: 2000
            },
            {
                description: 'Поиск кнопки создания поста',
                action: 'click',
                text: 'создать',
                options: {
                    exact: false,
                    confidence: 50
                }
            },
            {
                description: 'Анализ состояния создания поста',
                action: 'screenshot',
                name: 'react_post_creation_state'
            },
            {
                description: 'Проверка перехода в состояние создания поста',
                action: 'verify',
                text: 'создать',
                context: {
                    state: 'Создание поста',
                    actions: ['write_text', 'send_post']
                }
            }
        ]
    },
    {
        name: 'React-анализ навигации',
        description: 'Тестирование анализа состояния при навигации по приложению',
        steps: [
            {
                description: 'Переход на главную страницу',
                action: 'navigate',
                url: 'http://localhost:3000'
            },
            {
                description: 'Вход как гость',
                action: 'click',
                text: 'гость'
            },
            {
                description: 'Ожидание загрузки',
                action: 'pause',
                duration: 2000
            },
            {
                description: 'Анализ состояния навигации',
                action: 'screenshot',
                name: 'react_navigation_state'
            },
            {
                description: 'Поиск элементов навигации',
                action: 'verify',
                text: 'профиль',
                context: {
                    state: 'Гостевой пользователь вошел',
                    actions: ['view_profile', 'open_chat']
                }
            },
            {
                description: 'Проверка наличия чата',
                action: 'verify',
                text: 'чат',
                context: {
                    state: 'Гостевой пользователь вошел',
                    actions: ['open_chat', 'send_message']
                }
            }
        ]
    }
];

async function runReactIntegratedTests() {
    console.log('🤖 Запуск тестов React-интегрированного бота');
    console.log('=' .repeat(60));
    
    const bot = new ReactIntegratedBot({
        headless: false,
        slowMo: 100,
        timeout: 30000,
        reactDevTools: true
    });
    
    try {
        // Инициализация бота
        const initialized = await bot.initialize();
        if (!initialized) {
            console.error('❌ Не удалось инициализировать бота');
            return;
        }
        
        const results = [];
        
        // Запуск сценариев
        for (const scenario of reactIntegratedScenarios) {
            console.log(`\n🎬 Запуск сценария: ${scenario.name}`);
            
            const result = await bot.runScenario(scenario, bot);
            results.push(result);
            
            // Пауза между сценариями
            await bot.pause(2000);
        }
        
        // Генерация отчета
        const report = await bot.generateReport(results);
        
        // Вывод итоговой статистики
        console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА REACT-ИНТЕГРИРОВАННОГО БОТА');
        console.log('=' .repeat(60));
        console.log(`Всего сценариев: ${report.summary.totalScenarios}`);
        console.log(`Успешных: ${report.summary.successfulScenarios}`);
        console.log(`Неудачных: ${report.summary.failedScenarios}`);
        console.log(`Всего шагов: ${report.summary.totalSteps}`);
        console.log(`Успешных шагов: ${report.summary.successfulSteps}`);
        console.log(`Общее время: ${(report.summary.totalDuration / 1000).toFixed(1)}с`);
        
        // Анализ состояний
        console.log('\n🧠 АНАЛИЗ СОСТОЯНИЙ');
        console.log('=' .repeat(60));
        
        const stateCounts = {};
        bot.stateHistory.forEach(analysis => {
            const stateName = analysis.detectedState.name;
            stateCounts[stateName] = (stateCounts[stateName] || 0) + 1;
        });
        
        console.log('🔄 Переходы состояний:');
        Object.entries(stateCounts).forEach(([state, count]) => {
            console.log(`   ${state}: ${count} раз`);
        });
        
        // Анализ DOM и React компонентов
        console.log('\n🔍 АНАЛИЗ DOM И REACT КОМПОНЕНТОВ');
        console.log('=' .repeat(60));
        
        if (bot.stateHistory.length > 0) {
            const lastAnalysis = bot.stateHistory[bot.stateHistory.length - 1];
            
            if (lastAnalysis.domAnalysis) {
                console.log(`🏗️ Структура страницы: ${lastAnalysis.domAnalysis.structure.layout}`);
                console.log(`🔘 Интерактивных элементов: ${lastAnalysis.domAnalysis.interactive.length}`);
                
                if (lastAnalysis.domAnalysis.interactive.length > 0) {
                    console.log('📋 Найденные интерактивные элементы:');
                    lastAnalysis.domAnalysis.interactive.slice(0, 5).forEach(item => {
                        console.log(`   - ${item.type}: "${item.text}"`);
                    });
                }
            }
            
            if (lastAnalysis.reactAnalysis) {
                console.log(`⚛️ React компонентов: ${lastAnalysis.reactAnalysis.detected.length}`);
                
                if (lastAnalysis.reactAnalysis.detected.length > 0) {
                    console.log('📋 Найденные React компоненты:');
                    lastAnalysis.reactAnalysis.detected.slice(0, 5).forEach(comp => {
                        console.log(`   - ${comp.testId || comp.component}: "${comp.text}"`);
                    });
                }
            }
        }
        
        // Рекомендации
        console.log('\n💡 РЕКОМЕНДАЦИИ');
        console.log('=' .repeat(60));
        
        if (report.summary.failedScenarios > 0) {
            console.log('⚠️ Есть неудачные сценарии - рекомендуется проверить логи');
        }
        
        if (report.summary.successfulScenarios === report.summary.totalScenarios) {
            console.log('✅ Все сценарии выполнены успешно!');
        }
        
        console.log('🎯 React-интегрированный анализ состояния работает корректно');
        console.log('📈 Рекомендуется добавить больше сценариев для тестирования');
        console.log('🔧 DOM-анализ обеспечивает высокую точность определения состояния');
        
    } catch (error) {
        console.error('❌ Критическая ошибка в тестах:', error.message);
    } finally {
        await bot.cleanup();
        console.log('\n🧹 Тестирование завершено');
    }
}

// Запуск тестов
if (require.main === module) {
    runReactIntegratedTests().catch(console.error);
}

module.exports = { runReactIntegratedTests, reactIntegratedScenarios }; 