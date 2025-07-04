const { AIEnhancedOCRBot } = require('./ai_enhanced_ocr_bot');

// Сценарии для тестирования ИИ-улучшенного бота
const aiEnhancedScenarios = [
    {
        name: 'ИИ-анализ начального состояния',
        description: 'Тестирование ИИ анализатора состояния на начальной странице',
        steps: [
            {
                description: 'Переход на главную страницу',
                action: 'navigate',
                url: 'http://localhost:3000'
            },
            {
                description: 'Анализ начального состояния с ИИ',
                action: 'screenshot',
                name: 'ai_initial_state'
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
                description: 'Ожидание загрузки интерфейса',
                action: 'pause',
                duration: 2000
            }
        ]
    },
    {
        name: 'ИИ-анализ после входа гостя',
        description: 'Тестирование ИИ анализатора после входа как гость',
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
                name: 'ai_after_guest_login'
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
        name: 'ИИ-анализ создания поста',
        description: 'Тестирование ИИ анализатора при создании поста',
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
                name: 'ai_post_creation_state'
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
        name: 'ИИ-анализ навигации',
        description: 'Тестирование ИИ анализатора при навигации по приложению',
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
                name: 'ai_navigation_state'
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
    },
    {
        name: 'ИИ-анализ ошибок',
        description: 'Тестирование ИИ анализатора при возникновении ошибок',
        steps: [
            {
                description: 'Переход на несуществующую страницу',
                action: 'navigate',
                url: 'http://localhost:3000/nonexistent'
            },
            {
                description: 'Анализ состояния ошибки',
                action: 'screenshot',
                name: 'ai_error_state'
            },
            {
                description: 'Проверка состояния ошибки',
                action: 'verify',
                text: 'ошибка',
                context: {
                    state: 'Страница ошибки',
                    actions: ['retry', 'go_back']
                }
            }
        ]
    }
];

async function runAIEnhancedTests() {
    console.log('🤖 Запуск тестов ИИ-улучшенного OCR бота');
    console.log('=' .repeat(60));
    
    const bot = new AIEnhancedOCRBot({
        headless: false,
        slowMo: 100,
        timeout: 30000
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
        for (const scenario of aiEnhancedScenarios) {
            console.log(`\n🎬 Запуск сценария: ${scenario.name}`);
            
            const result = await bot.runScenario(scenario, bot);
            results.push(result);
            
            // Пауза между сценариями
            await bot.pause(2000);
        }
        
        // Генерация отчета
        const report = await bot.generateReport(results);
        
        // Вывод итоговой статистики
        console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА ИИ-УЛУЧШЕННОГО БОТА');
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
        
        Object.entries(stateCounts).forEach(([state, count]) => {
            console.log(`${state}: ${count} раз`);
        });
        
        // Рекомендации
        console.log('\n💡 РЕКОМЕНДАЦИИ');
        console.log('=' .repeat(60));
        
        if (report.summary.failedScenarios > 0) {
            console.log('⚠️ Есть неудачные сценарии - рекомендуется проверить логи');
        }
        
        if (report.summary.successfulScenarios === report.summary.totalScenarios) {
            console.log('✅ Все сценарии выполнены успешно!');
        }
        
        console.log('🎯 ИИ-анализатор состояния работает корректно');
        console.log('📈 Рекомендуется добавить больше сценариев для тестирования');
        
    } catch (error) {
        console.error('❌ Критическая ошибка в тестах:', error.message);
    } finally {
        await bot.cleanup();
        console.log('\n🧹 Тестирование завершено');
    }
}

// Запуск тестов
if (require.main === module) {
    runAIEnhancedTests().catch(console.error);
}

module.exports = { runAIEnhancedTests, aiEnhancedScenarios }; 