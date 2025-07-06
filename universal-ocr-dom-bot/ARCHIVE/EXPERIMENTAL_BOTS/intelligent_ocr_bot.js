const puppeteer = require('puppeteer');
const { IntelligentStateAnalyzer } = require('./intelligent_state_analyzer');
const fs = require('fs');
const path = require('path');

class IntelligentOCRBot {
    constructor() {
        this.browsers = [];
        this.pages = [];
        this.stateAnalyzer = new IntelligentStateAnalyzer();
        this.screenshotDir = 'test_screenshots';
        this.stepCounter = 0;
        this.currentState = null;
        this.actionHistory = [];
        
        // Создаем папку для скриншотов если её нет
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async init(browserCount = 1) {
        console.log(`🤖 Инициализация интеллектуального OCR бота (${browserCount} браузеров)...`);
        
        for (let i = 0; i < browserCount; i++) {
            const browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized', '--no-sandbox', `--user-data-dir=./user-data-${i}`]
            });
            
            const page = await browser.newPage();
            
            this.browsers.push(browser);
            this.pages.push(page);
            
            console.log(`✅ Браузер ${i + 1} запущен`);
        }
    }

    async takeScreenshot(pageIndex, name) {
        this.stepCounter++;
        const filename = `${this.screenshotDir}/step${this.stepCounter.toString().padStart(2, '0')}_browser${pageIndex + 1}_${name}.png`;
        await this.pages[pageIndex].screenshot({ path: filename, fullPage: true });
        console.log(`📸 Скриншот браузера ${pageIndex + 1} сохранен: ${filename}`);
        return filename;
    }

    async analyzeCurrentState(pageIndex) {
        console.log(`🔍 Анализ текущего состояния браузера ${pageIndex + 1}...`);
        
        const screenshotPath = await this.takeScreenshot(pageIndex, 'state_analysis');
        const stateAnalysis = await this.stateAnalyzer.analyzeScreenshot(screenshotPath);
        
        this.currentState = stateAnalysis;
        
        console.log(`📊 Состояние: ${stateAnalysis.detectedState.name}`);
        console.log(`🎯 Уверенность: ${(stateAnalysis.confidence * 100).toFixed(1)}%`);
        console.log(`🔧 Доступные действия: ${stateAnalysis.availableActions.join(', ')}`);
        
        if (stateAnalysis.context.suggestedNextActions.length > 0) {
            console.log(`💡 Рекомендуемые действия: ${stateAnalysis.context.suggestedNextActions.join(', ')}`);
        }
        
        return stateAnalysis;
    }

    async findTextInCurrentState(pageIndex, searchText, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Поиск "${searchText}" ${description}`);
        
        // Сначала анализируем текущее состояние
        const stateAnalysis = await this.analyzeCurrentState(pageIndex);
        
        // Проверяем, подходит ли текущее состояние для поиска
        if (stateAnalysis.confidence < 0.5) {
            throw new Error(`Не удалось определить состояние приложения (уверенность: ${(stateAnalysis.confidence * 100).toFixed(1)}%)`);
        }
        
        // Ищем текст среди найденных элементов
        const matchingElements = stateAnalysis.elements.filter(element => 
            element.text.toLowerCase().includes(searchText.toLowerCase()) && 
            element.confidence > 50
        );
        
        if (matchingElements.length === 0) {
            const error = `Текст "${searchText}" не найден в текущем состоянии "${stateAnalysis.detectedState.name}"`;
            await this.handleError(error, 'текст не найден', {
                searchText,
                currentState: stateAnalysis.detectedState.name,
                confidence: stateAnalysis.confidence,
                availableElements: stateAnalysis.elements.map(el => el.text).slice(0, 10),
                browserIndex: pageIndex + 1,
                description
            });
            return false;
        }

        // Выбираем лучший элемент (с наивысшим доверием)
        const bestElement = matchingElements.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );
        
        console.log(`✅ Найдено "${bestElement.text}" (conf: ${bestElement.confidence}%)`);
        console.log(`📍 Координаты: x=${bestElement.x}, y=${bestElement.y}, центр: (${bestElement.centerX}, ${bestElement.centerY})`);

        try {
            await this.pages[pageIndex].mouse.click(bestElement.centerX, bestElement.centerY);
            console.log(`🖱️ Клик по координатам (${bestElement.centerX}, ${bestElement.centerY})`);
            
            // Ждем изменения состояния
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Анализируем новое состояние
            await this.analyzeCurrentState(pageIndex);
            
            return true;
        } catch (error) {
            await this.handleError(`Клик не выполнен: ${error.message}`, 'клик не выполнен', {
                searchText,
                coordinates: { x: bestElement.centerX, y: bestElement.centerY },
                browserIndex: pageIndex + 1,
                description
            });
            return false;
        }
    }

    async verifyTextInCurrentState(pageIndex, searchText, description = '') {
        console.log(`🔍 Браузер ${pageIndex + 1}: Проверка наличия "${searchText}" ${description}`);
        
        const stateAnalysis = await this.analyzeCurrentState(pageIndex);
        
        const matchingElements = stateAnalysis.elements.filter(element => 
            element.text.toLowerCase().includes(searchText.toLowerCase()) && 
            element.confidence > 50
        );
        
        if (matchingElements.length > 0) {
            console.log(`✅ Текст "${searchText}" найден (${matchingElements.length} совпадений)`);
            return true;
        } else {
            const error = `Текст "${searchText}" не найден в текущем состоянии "${stateAnalysis.detectedState.name}"`;
            await this.handleError(error, 'текст не найден', {
                searchText,
                currentState: stateAnalysis.detectedState.name,
                confidence: stateAnalysis.confidence,
                availableElements: stateAnalysis.elements.map(el => el.text).slice(0, 10),
                browserIndex: pageIndex + 1,
                description
            });
            return false;
        }
    }

    async waitForStateChange(pageIndex, targetState, timeout = 10000, description = '') {
        console.log(`⏳ Браузер ${pageIndex + 1}: Ожидание перехода в состояние "${targetState}" ${description}`);
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const stateAnalysis = await this.analyzeCurrentState(pageIndex);
            
            if (stateAnalysis.detectedState.name === targetState) {
                console.log(`✅ Переход в состояние "${targetState}" произошел через ${Date.now() - startTime}ms`);
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const error = `Переход в состояние "${targetState}" не произошел за ${timeout}ms`;
        await this.handleError(error, 'таймаут', {
            targetState,
            currentState: this.currentState?.detectedState.name || 'неизвестно',
            timeout,
            browserIndex: pageIndex + 1,
            description
        });
        return false;
    }

    async handleError(errorMessage, errorType, context) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ ОШИБКА ОБНАРУЖЕНА!');
        console.log('='.repeat(60));
        console.log(`🔍 Описание: ${errorMessage}`);
        console.log(`📋 Контекст: ${JSON.stringify(context, null, 2)}`);
        
        // Анализируем текущее состояние для лучших рекомендаций
        if (this.currentState) {
            console.log(`\n📊 ТЕКУЩЕЕ СОСТОЯНИЕ:`);
            console.log(`   Состояние: ${this.currentState.detectedState.name}`);
            console.log(`   Уверенность: ${(this.currentState.confidence * 100).toFixed(1)}%`);
            console.log(`   Доступные элементы: ${this.currentState.elements.map(el => el.text).slice(0, 5).join(', ')}`);
        }
        
        // Предлагаем способы исправления
        console.log('\n💡 ВОЗМОЖНЫЕ СПОСОБЫ ИСПРАВЛЕНИЯ:');
        const suggestions = this.getErrorSuggestions(errorType, context);
        suggestions.forEach((suggestion, index) => {
            console.log(`   ${index + 1}. ${suggestion}`);
        });
        
        // Дополнительные рекомендации
        console.log('\n🔧 ДОПОЛНИТЕЛЬНЫЕ РЕКОМЕНДАЦИИ:');
        console.log('   1. Проверьте скриншот для анализа проблемы');
        console.log('   2. Убедитесь, что серверы backend и frontend запущены');
        console.log('   3. Проверьте стабильность интернет-соединения');
        console.log('   4. Попробуйте перезапустить тест');
        console.log('   5. Проверьте, соответствует ли состояние ожидаемому');
        
        // Сохраняем информацию об ошибке
        const errorInfo = {
            timestamp: new Date().toISOString(),
            error: errorMessage,
            type: errorType,
            context: context,
            currentState: this.currentState ? {
                name: this.currentState.detectedState.name,
                confidence: this.currentState.confidence,
                availableActions: this.currentState.availableActions
            } : null,
            suggestions: suggestions
        };
        
        const errorLogPath = './test_logs/intelligent_error_log.json';
        if (!fs.existsSync('./test_logs')) {
            fs.mkdirSync('./test_logs', { recursive: true });
        }
        
        let errorLog = [];
        if (fs.existsSync(errorLogPath)) {
            errorLog = JSON.parse(fs.readFileSync(errorLogPath, 'utf8'));
        }
        errorLog.push(errorInfo);
        fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
        
        console.log(`\n📝 Информация об ошибке сохранена в: ${errorLogPath}`);
        console.log('='.repeat(60));
        
        // Останавливаем выполнение
        throw new Error(`КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}`);
    }

    getErrorSuggestions(errorType, context) {
        const baseSuggestions = {
            'текст не найден': [
                'Проверьте правильность написания текста',
                'Возможно, элемент еще не загрузился - увеличьте время ожидания',
                'Проверьте, не изменился ли интерфейс',
                'Попробуйте альтернативные названия элемента'
            ],
            'таймаут': [
                'Увеличьте время ожидания',
                'Проверьте стабильность интернет-соединения',
                'Возможно, сервер перегружен',
                'Проверьте, не заблокирован ли доступ'
            ],
            'клик не выполнен': [
                'Проверьте, не перекрыт ли элемент другими элементами',
                'Возможно, элемент находится вне видимой области',
                'Попробуйте прокрутить страницу к элементу',
                'Проверьте, не изменились ли координаты элемента'
            ]
        };

        let suggestions = baseSuggestions[errorType] || baseSuggestions['текст не найден'];

        // Добавляем специфичные рекомендации на основе контекста
        if (context.currentState) {
            suggestions.push(`Проверьте, что приложение находится в состоянии "${context.currentState}"`);
            suggestions.push('Возможно, нужно дождаться загрузки всех элементов');
        }

        if (context.availableElements && context.availableElements.length > 0) {
            suggestions.push(`Доступные элементы: ${context.availableElements.join(', ')}`);
        }

        return suggestions;
    }

    async runIntelligentScenario(scenario) {
        console.log(`\n🎬 Запуск интеллектуального сценария: ${scenario.name}`);
        console.log(`📝 Описание: ${scenario.description}`);
        
        const results = {
            scenario: scenario.name,
            steps: [],
            success: true,
            error: null,
            stateTransitions: []
        };

        try {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];
                console.log(`\n📋 Шаг ${i + 1}: ${step.description}`);
                
                const stepResult = {
                    step: i + 1,
                    description: step.description,
                    success: false,
                    error: null,
                    stateBefore: this.currentState?.detectedState.name,
                    stateAfter: null
                };

                try {
                    switch (step.action) {
                        case 'navigate':
                            for (let j = 0; j < this.pages.length; j++) {
                                await this.pages[j].goto(step.url, { waitUntil: 'networkidle2' });
                                console.log(`✅ Браузер ${j + 1}: Переход на ${step.url}`);
                            }
                            stepResult.success = true;
                            break;
                            
                        case 'wait':
                            console.log(`⏳ Ожидание ${step.duration}ms`);
                            await new Promise(resolve => setTimeout(resolve, step.duration));
                            stepResult.success = true;
                            break;
                            
                        case 'analyze_state':
                            const stateAnalysis = await this.analyzeCurrentState(step.browserIndex);
                            stepResult.success = stateAnalysis.confidence > 0.5;
                            stepResult.stateAfter = stateAnalysis.detectedState.name;
                            break;
                            
                        case 'click':
                            const clickSuccess = await this.findTextInCurrentState(step.browserIndex, step.text, step.description);
                            if (!clickSuccess && step.required !== false) {
                                throw new Error(`Не удалось кликнуть по тексту "${step.text}"`);
                            }
                            stepResult.success = clickSuccess;
                            stepResult.stateAfter = this.currentState?.detectedState.name;
                            break;
                            
                        case 'verify':
                            const verifySuccess = await this.verifyTextInCurrentState(step.browserIndex, step.text, step.description);
                            if (!verifySuccess && step.required !== false) {
                                throw new Error(`Текст "${step.text}" не найден`);
                            }
                            stepResult.success = verifySuccess;
                            break;
                            
                        case 'wait_for_state':
                            const waitSuccess = await this.waitForStateChange(step.browserIndex, step.targetState, step.timeout, step.description);
                            if (!waitSuccess && step.required !== false) {
                                throw new Error(`Переход в состояние "${step.targetState}" не произошел`);
                            }
                            stepResult.success = waitSuccess;
                            stepResult.stateAfter = this.currentState?.detectedState.name;
                            break;
                            
                        default:
                            throw new Error(`Неизвестное действие: ${step.action}`);
                    }
                } catch (error) {
                    stepResult.error = error.message;
                    stepResult.success = false;
                    
                    if (step.required !== false) {
                        throw error;
                    }
                }
                
                results.steps.push(stepResult);
                
                // Записываем переход состояния
                if (stepResult.stateBefore && stepResult.stateAfter && stepResult.stateBefore !== stepResult.stateAfter) {
                    results.stateTransitions.push({
                        step: i + 1,
                        from: stepResult.stateBefore,
                        to: stepResult.stateAfter
                    });
                }
                
                if (!stepResult.success && step.required !== false) {
                    results.success = false;
                    results.error = stepResult.error;
                    break;
                }
            }
        } catch (error) {
            results.success = false;
            results.error = error.message;
        }

        return results;
    }

    async generateIntelligentReport() {
        console.log('\n📊 ГЕНЕРАЦИЯ ИНТЕЛЛЕКТУАЛЬНОГО ОТЧЕТА');
        console.log('=' .repeat(60));
        
        const stateHistory = await this.stateAnalyzer.getStateHistory();
        const stateReport = await this.stateAnalyzer.generateStateReport();
        
        const report = {
            timestamp: new Date().toISOString(),
            stateAnalysis: stateReport,
            actionHistory: this.actionHistory,
            recommendations: this.generateRecommendations(stateHistory)
        };
        
        const reportPath = './test_logs/intelligent_report.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`💾 Интеллектуальный отчет сохранен: ${reportPath}`);
        
        return report;
    }

    generateRecommendations(stateHistory) {
        const recommendations = [];
        
        // Анализируем переходы состояний
        const stateTransitions = [];
        for (let i = 1; i < stateHistory.length; i++) {
            const prev = stateHistory[i - 1];
            const current = stateHistory[i];
            if (prev.detectedState.name !== current.detectedState.name) {
                stateTransitions.push({
                    from: prev.detectedState.name,
                    to: current.detectedState.name,
                    confidence: current.confidence
                });
            }
        }
        
        // Рекомендации на основе анализа
        if (stateHistory.some(s => s.confidence < 0.6)) {
            recommendations.push('Улучшить распознавание состояний - некоторые состояния определяются с низкой уверенностью');
        }
        
        if (stateTransitions.length === 0) {
            recommendations.push('Приложение не переходило между состояниями - возможно, есть проблемы с навигацией');
        }
        
        const lowConfidenceStates = stateHistory.filter(s => s.confidence < 0.5);
        if (lowConfidenceStates.length > 0) {
            recommendations.push(`Проверить состояния: ${lowConfidenceStates.map(s => s.detectedState.name).join(', ')}`);
        }
        
        return recommendations;
    }

    async close() {
        for (let i = 0; i < this.browsers.length; i++) {
            if (this.browsers[i]) {
                await this.browsers[i].close();
                console.log(`🔒 Браузер ${i + 1} закрыт`);
            }
        }
    }
}

module.exports = { IntelligentOCRBot }; 