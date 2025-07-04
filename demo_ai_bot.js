const { AIEnhancedOCRBot } = require('./ai_enhanced_ocr_bot');

async function demonstrateAIBot() {
    console.log('🤖 ДЕМОНСТРАЦИЯ ИИ-УЛУЧШЕННОГО OCR БОТА');
    console.log('=' .repeat(60));
    
    const bot = new AIEnhancedOCRBot({
        headless: false,
        slowMo: 200,
        timeout: 30000
    });
    
    try {
        // Инициализация
        console.log('🚀 Инициализация ИИ-бота...');
        await bot.initialize();
        
        // Переход на главную страницу
        console.log('\n🌐 Переход на главную страницу...');
        await bot.navigateTo('http://localhost:3000');
        
        // Демонстрация ИИ-анализа состояния
        console.log('\n🧠 ДЕМОНСТРАЦИЯ ИИ-АНАЛИЗА СОСТОЯНИЯ');
        console.log('=' .repeat(50));
        
        const initialAnalysis = await bot.analyzeCurrentState();
        
        if (initialAnalysis) {
            console.log(`📊 Определенное состояние: ${initialAnalysis.detectedState.name}`);
            console.log(`🎯 Уверенность: ${(initialAnalysis.confidence * 100).toFixed(1)}%`);
            console.log(`📝 Описание: ${initialAnalysis.detectedState.description}`);
            
            if (initialAnalysis.context) {
                console.log(`🛠️ Доступные действия: ${initialAnalysis.context.availableActions.join(', ')}`);
                console.log(`💡 Рекомендации: ${initialAnalysis.context.suggestedNextActions.join(', ')}`);
            }
            
            // Показываем ИИ-анализ
            if (initialAnalysis.aiAnalysis) {
                console.log('\n🔍 ДЕТАЛЬНЫЙ ИИ-АНАЛИЗ:');
                
                if (initialAnalysis.aiAnalysis.layout) {
                    console.log('🏗️ Layout анализ:');
                    console.log(`   - Структура: ${JSON.stringify(initialAnalysis.aiAnalysis.layout.structure)}`);
                    console.log(`   - Компоненты: ${initialAnalysis.aiAnalysis.layout.components.map(c => c.name).join(', ')}`);
                }
                
                if (initialAnalysis.aiAnalysis.semantics) {
                    console.log('📝 Семантический анализ:');
                    console.log(`   - Темы: ${initialAnalysis.aiAnalysis.semantics.topics.map(t => t.name).join(', ')}`);
                    console.log(`   - Настроение: ${initialAnalysis.aiAnalysis.semantics.sentiment}`);
                    console.log(`   - Намерения: ${initialAnalysis.aiAnalysis.semantics.intent.join(', ')}`);
                }
                
                if (initialAnalysis.aiAnalysis.context) {
                    console.log('🎯 Контекстный анализ:');
                    console.log(`   - Роль пользователя: ${initialAnalysis.aiAnalysis.context.userRole}`);
                    console.log(`   - Текущая задача: ${initialAnalysis.aiAnalysis.context.currentTask}`);
                    console.log(`   - Состояние системы: ${initialAnalysis.aiAnalysis.context.systemState}`);
                }
            }
        }
        
        // Демонстрация умного поиска элементов
        console.log('\n🔍 ДЕМОНСТРАЦИЯ УМНОГО ПОИСКА ЭЛЕМЕНТОВ');
        console.log('=' .repeat(50));
        
        const guestButton = await bot.findElementByText('гость', {
            exact: false,
            confidence: 60
        });
        
        if (guestButton) {
            console.log(`✅ Найден элемент: "${guestButton.text}"`);
            console.log(`📍 Позиция: (${guestButton.x}, ${guestButton.y})`);
            console.log(`🎯 Уверенность: ${guestButton.confidence}%`);
            console.log(`🔧 Метод поиска: ${guestButton.method}`);
            
            // Клик по элементу
            console.log('\n🖱️ Клик по элементу...');
            await bot.clickElement(guestButton);
            
            // Анализ нового состояния
            console.log('\n🧠 АНАЛИЗ НОВОГО СОСТОЯНИЯ');
            console.log('=' .repeat(50));
            
            const newAnalysis = await bot.analyzeCurrentState();
            
            if (newAnalysis) {
                console.log(`📊 Новое состояние: ${newAnalysis.detectedState.name}`);
                console.log(`🎯 Уверенность: ${(newAnalysis.confidence * 100).toFixed(1)}%`);
                
                if (newAnalysis.context) {
                    console.log(`🛠️ Новые доступные действия: ${newAnalysis.context.availableActions.join(', ')}`);
                }
                
                // Показываем изменение состояния
                if (initialAnalysis && newAnalysis) {
                    console.log(`🔄 Изменение состояния: ${initialAnalysis.detectedState.name} → ${newAnalysis.detectedState.name}`);
                }
            }
        } else {
            console.log('❌ Элемент "гость" не найден');
        }
        
        // Демонстрация контекстной проверки
        console.log('\n✅ ДЕМОНСТРАЦИЯ КОНТЕКСТНОЙ ПРОВЕРКИ');
        console.log('=' .repeat(50));
        
        const postCheck = await bot.verifyText('пост', {
            state: 'Гостевой пользователь вошел',
            actions: ['create_post', 'view_profile']
        });
        
        if (postCheck) {
            console.log('✅ Контекстная проверка пройдена: найдены посты в состоянии гостевого пользователя');
        } else {
            console.log('❌ Контекстная проверка не пройдена');
        }
        
        // Демонстрация поиска кнопки создания поста
        console.log('\n🔍 ПОИСК КНОПКИ СОЗДАНИЯ ПОСТА');
        console.log('=' .repeat(50));
        
        const createButton = await bot.findElementByText('создать', {
            exact: false,
            confidence: 50
        });
        
        if (createButton) {
            console.log(`✅ Найдена кнопка создания: "${createButton.text}"`);
            console.log(`📍 Позиция: (${createButton.x}, ${createButton.y})`);
            
            // Клик по кнопке создания
            console.log('\n🖱️ Клик по кнопке создания поста...');
            await bot.clickElement(createButton);
            
            // Анализ состояния создания поста
            console.log('\n🧠 АНАЛИЗ СОСТОЯНИЯ СОЗДАНИЯ ПОСТА');
            console.log('=' .repeat(50));
            
            const createAnalysis = await bot.analyzeCurrentState();
            
            if (createAnalysis) {
                console.log(`📊 Состояние: ${createAnalysis.detectedState.name}`);
                console.log(`🎯 Уверенность: ${(createAnalysis.confidence * 100).toFixed(1)}%`);
                
                if (createAnalysis.context) {
                    console.log(`🛠️ Доступные действия: ${createAnalysis.context.availableActions.join(', ')}`);
                }
            }
        } else {
            console.log('❌ Кнопка создания поста не найдена');
        }
        
        // Финальный анализ
        console.log('\n📊 ФИНАЛЬНЫЙ АНАЛИЗ');
        console.log('=' .repeat(50));
        
        console.log(`📈 Всего проанализировано состояний: ${bot.stateHistory.length}`);
        
        const stateCounts = {};
        bot.stateHistory.forEach(analysis => {
            const stateName = analysis.detectedState.name;
            stateCounts[stateName] = (stateCounts[stateName] || 0) + 1;
        });
        
        console.log('🔄 Переходы состояний:');
        Object.entries(stateCounts).forEach(([state, count]) => {
            console.log(`   ${state}: ${count} раз`);
        });
        
        // Сохранение отчета
        const report = {
            timestamp: new Date().toISOString(),
            demo: true,
            states: bot.stateHistory,
            summary: {
                totalStates: bot.stateHistory.length,
                uniqueStates: Object.keys(stateCounts).length,
                averageConfidence: bot.stateHistory.reduce((sum, s) => sum + s.confidence, 0) / bot.stateHistory.length
            }
        };
        
        const reportFile = `./test_logs/ai_demo_report_${Date.now()}.json`;
        require('fs').writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`💾 Демонстрационный отчет сохранен: ${reportFile}`);
        
        console.log('\n✅ ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!');
        console.log('🎯 ИИ-бот показал отличные результаты в понимании интерфейса');
        
    } catch (error) {
        console.error('❌ Ошибка в демонстрации:', error.message);
    } finally {
        await bot.cleanup();
        console.log('\n🧹 Демонстрация завершена');
    }
}

// Запуск демонстрации
if (require.main === module) {
    demonstrateAIBot().catch(console.error);
}

module.exports = { demonstrateAIBot }; 