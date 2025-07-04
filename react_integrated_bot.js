const puppeteer = require('puppeteer');
const { DOMBasedStateAnalyzer } = require('./dom_based_state_analyzer');

class ReactIntegratedBot {
    constructor(options = {}) {
        this.browser = null;
        this.page = null;
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.screenshotDir = options.screenshotDir || './test_screenshots/react_integrated';
        this.logDir = options.logDir || './test_logs';
        this.headless = options.headless !== false;
        this.slowMo = options.slowMo || 100;
        this.timeout = options.timeout || 30000;
        
        // DOM-анализатор
        this.domAnalyzer = new DOMBasedStateAnalyzer();
        
        // Состояние бота
        this.currentState = null;
        this.stateHistory = [];
        this.errorCount = 0;
        this.maxErrors = 3;
        
        // React DevTools интеграция
        this.reactDevToolsEnabled = options.reactDevTools !== false;
        
        // Создаем директории
        this.ensureDirectories();
        
        console.log('🤖 React-интегрированный бот инициализирован');
    }

    ensureDirectories() {
        const dirs = [this.screenshotDir, this.logDir];
        dirs.forEach(dir => {
            if (!require('fs').existsSync(dir)) {
                require('fs').mkdirSync(dir, { recursive: true });
            }
        });
    }

    async initialize() {
        try {
            console.log('🚀 Инициализация React-интегрированного бота...');
            
            this.browser = await puppeteer.launch({
                headless: this.headless,
                slowMo: this.slowMo,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            this.page = await this.browser.newPage();
            
            // Настройка viewport
            await this.page.setViewport({
                width: 1200,
                height: 800
            });

            // Настройка таймаутов
            this.page.setDefaultTimeout(this.timeout);
            this.page.setDefaultNavigationTimeout(this.timeout);

            // Включаем React DevTools (если доступно)
            if (this.reactDevToolsEnabled) {
                await this.enableReactDevTools();
            }

            console.log('✅ React-интегрированный бот готов к работе');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка инициализации React-интегрированного бота:', error.message);
            return false;
        }
    }

    async enableReactDevTools() {
        try {
            // Пытаемся подключить React DevTools
            await this.page.evaluateOnNewDocument(() => {
                // Включаем React DevTools
                if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                    console.log('React DevTools доступны');
                }
            });

            console.log('🔧 React DevTools включены');
        } catch (error) {
            console.log('⚠️ React DevTools недоступны:', error.message);
        }
    }

    async navigateTo(url = null) {
        const targetUrl = url || this.baseUrl;
        console.log(`🌐 Переход на: ${targetUrl}`);
        
        try {
            await this.page.goto(targetUrl, { waitUntil: 'networkidle2' });
            await this.pause(2000);
            
            // Анализируем начальное состояние через DOM
            await this.analyzeCurrentState();
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка навигации:', error.message);
            return false;
        }
    }

    async analyzeCurrentState() {
        try {
            const screenshotPath = await this.takeScreenshot('current_state');
            const analysis = await this.domAnalyzer.analyzeStateFromDOM(this.page);
            
            this.currentState = analysis;
            this.stateHistory.push(analysis);
            
            console.log(`🧠 Текущее состояние: ${analysis.detectedState.name}`);
            console.log(`📊 Уверенность: ${(analysis.confidence * 100).toFixed(1)}%`);
            console.log(`🔗 URL: ${analysis.url}`);
            
            // Показываем детали анализа
            if (analysis.domAnalysis) {
                console.log(`🏗️ Структура: ${analysis.domAnalysis.structure.layout}`);
                console.log(`🔘 Интерактивных элементов: ${analysis.domAnalysis.interactive.length}`);
            }
            
            if (analysis.reactAnalysis) {
                console.log(`⚛️ React компонентов: ${analysis.reactAnalysis.detected.length}`);
            }
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Ошибка анализа состояния:', error.message);
            return null;
        }
    }

    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${name}_${timestamp}.png`;
        const filepath = require('path').join(this.screenshotDir, filename);
        
        await this.page.screenshot({
            path: filepath,
            fullPage: true
        });
        
        console.log(`📸 Скриншот сохранен: ${filepath}`);
        return filepath;
    }

    async findElementByText(text, options = {}) {
        const {
            exact = false,
            timeout = 5000,
            confidence = 70,
            state = this.currentState?.detectedState
        } = options;

        console.log(`🔍 Поиск элемента: "${text}" (точное совпадение: ${exact})`);
        
        try {
            // Сначала пробуем найти через DOM-анализ
            if (state) {
                const domElement = await this.domAnalyzer.findElementByState(this.page, text, state);
                if (domElement) {
                    console.log(`✅ Элемент найден через DOM-анализ: "${text}"`);
                    return domElement;
                }
            }

            // Затем пробуем стандартные методы
            const standardElement = await this.findElementStandard(text, exact, confidence);
            if (standardElement) {
                console.log(`✅ Элемент найден стандартным методом: "${text}"`);
                return standardElement;
            }

            console.log(`❌ Элемент не найден: "${text}"`);
            return null;
            
        } catch (error) {
            console.error(`❌ Ошибка поиска элемента "${text}":`, error.message);
            return null;
        }
    }

    async findElementStandard(text, exact = false, confidence = 70) {
        try {
            // Поиск через DOM
            const domSelector = exact 
                ? `text="${text}"` 
                : `text*="${text}"`;
            
            const element = await this.page.$(`[${domSelector}]`);
            if (element) {
                const box = await element.boundingBox();
                return {
                    text: text,
                    x: box.x + box.width / 2,
                    y: box.y + box.height / 2,
                    confidence: 100,
                    method: 'dom'
                };
            }
            
            // Поиск через XPath
            const xpath = exact 
                ? `//*[text()="${text}"]`
                : `//*[contains(text(),"${text}")]`;
            
            const xpathElement = await this.page.$x(xpath);
            if (xpathElement.length > 0) {
                const box = await xpathElement[0].boundingBox();
                return {
                    text: text,
                    x: box.x + box.width / 2,
                    y: box.y + box.height / 2,
                    confidence: 90,
                    method: 'xpath'
                };
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    async clickElement(element) {
        if (!element) {
            console.log('❌ Нет элемента для клика');
            return false;
        }

        try {
            console.log(`🖱️ Клик по элементу: "${element.text}" (${element.x}, ${element.y})`);
            
            if (element.element) {
                // Клик через элемент
                await element.element.click();
            } else {
                // Клик по координатам
                await this.page.mouse.click(element.x, element.y);
            }
            
            await this.pause(1000);
            
            // Анализируем новое состояние
            await this.analyzeCurrentState();
            
            return true;
            
        } catch (error) {
            console.error(`❌ Ошибка клика по элементу "${element.text}":`, error.message);
            return false;
        }
    }

    async typeText(text, selector = null) {
        try {
            console.log(`⌨️ Ввод текста: "${text}"`);
            
            if (selector) {
                await this.page.type(selector, text);
            } else {
                // Ищем поле ввода
                const inputElement = await this.page.$('input, textarea');
                if (inputElement) {
                    await inputElement.click();
                    await this.page.keyboard.type(text);
                } else {
                    console.log('❌ Не найдено поле для ввода');
                    return false;
                }
            }
            
            await this.pause(500);
            return true;
            
        } catch (error) {
            console.error(`❌ Ошибка ввода текста:`, error.message);
            return false;
        }
    }

    async waitForElement(text, timeout = 10000) {
        console.log(`⏳ Ожидание элемента: "${text}"`);
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const element = await this.findElementByText(text);
            if (element) {
                console.log(`✅ Элемент появился: "${text}"`);
                return element;
            }
            
            await this.pause(500);
        }
        
        console.log(`⏰ Таймаут ожидания элемента: "${text}"`);
        return null;
    }

    async verifyText(text, context = null) {
        console.log(`🔍 Проверка текста: "${text}"`);
        
        // Проверяем через DOM
        const domCheck = await this.page.evaluate((searchText) => {
            return document.body.innerText.toLowerCase().includes(searchText.toLowerCase());
        }, text);
        
        if (domCheck) {
            console.log(`✅ Текст найден в DOM: "${text}"`);
            
            // Если указан контекст, проверяем его
            if (context && this.currentState) {
                const contextMatch = this.verifyContext(this.currentState, context);
                if (!contextMatch) {
                    console.log(`⚠️ Контекст не соответствует ожидаемому`);
                    return false;
                }
            }
            
            return true;
        } else {
            console.log(`❌ Текст не найден в DOM: "${text}"`);
            return false;
        }
    }

    verifyContext(actualState, expectedContext) {
        // Проверяем соответствие контекста
        if (expectedContext.state && actualState.detectedState.name !== expectedContext.state) {
            return false;
        }
        
        if (expectedContext.actions) {
            const hasActions = expectedContext.actions.some(action => 
                actualState.availableActions.includes(action)
            );
            if (!hasActions) {
                return false;
            }
        }
        
        return true;
    }

    async executeStep(step, bot = null) {
        const currentBot = bot || this;
        
        try {
            console.log(`\n📋 Выполнение шага: ${step.description}`);
            
            // Анализируем текущее состояние перед выполнением
            const preState = await currentBot.analyzeCurrentState();
            
            let result = false;
            
            switch (step.action) {
                case 'navigate':
                    result = await currentBot.navigateTo(step.url);
                    break;
                    
                case 'click':
                    const element = await currentBot.findElementByText(step.text, {
                        ...step.options,
                        state: preState?.detectedState
                    });
                    if (element) {
                        result = await currentBot.clickElement(element);
                    } else {
                        console.log(`❌ Элемент не найден: "${step.text}"`);
                        result = false;
                    }
                    break;
                    
                case 'type':
                    result = await currentBot.typeText(step.text, step.selector);
                    break;
                    
                case 'wait':
                    result = await currentBot.waitForElement(step.text, step.timeout);
                    break;
                    
                case 'verify':
                    result = await currentBot.verifyText(step.text, step.context);
                    break;
                    
                case 'screenshot':
                    await currentBot.takeScreenshot(step.name);
                    result = true;
                    break;
                    
                case 'pause':
                    await currentBot.pause(step.duration);
                    result = true;
                    break;
                    
                default:
                    console.log(`⚠️ Неизвестное действие: ${step.action}`);
                    result = false;
            }
            
            // Анализируем состояние после выполнения
            const postState = await currentBot.analyzeCurrentState();
            
            // Проверяем изменение состояния
            if (preState && postState && preState.detectedState.name !== postState.detectedState.name) {
                console.log(`🔄 Изменение состояния: ${preState.detectedState.name} → ${postState.detectedState.name}`);
            }
            
            if (!result) {
                currentBot.errorCount++;
                console.log(`❌ Шаг не выполнен: ${step.description}`);
                
                // Если слишком много ошибок, останавливаемся
                if (currentBot.errorCount >= currentBot.maxErrors) {
                    throw new Error(`Превышено максимальное количество ошибок (${currentBot.maxErrors})`);
                }
            } else {
                currentBot.errorCount = 0; // Сбрасываем счетчик ошибок при успехе
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ Критическая ошибка в шаге "${step.description}":`, error.message);
            currentBot.errorCount++;
            
            // Сохраняем информацию об ошибке
            await currentBot.saveErrorInfo(step, error);
            
            throw error;
        }
    }

    async runScenario(scenario, bot = null) {
        const currentBot = bot || this;
        
        console.log(`\n🎬 Запуск сценария: ${scenario.name}`);
        console.log(`📝 Описание: ${scenario.description}`);
        
        const results = {
            name: scenario.name,
            description: scenario.description,
            steps: [],
            startTime: new Date(),
            success: true,
            errorCount: 0
        };
        
        try {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];
                const stepResult = {
                    index: i + 1,
                    description: step.description,
                    action: step.action,
                    success: false,
                    error: null,
                    duration: 0
                };
                
                const startTime = Date.now();
                
                try {
                    stepResult.success = await currentBot.executeStep(step, currentBot);
                    stepResult.duration = Date.now() - startTime;
                    
                    if (!stepResult.success) {
                        results.errorCount++;
                    }
                    
                } catch (error) {
                    stepResult.success = false;
                    stepResult.error = error.message;
                    stepResult.duration = Date.now() - startTime;
                    results.errorCount++;
                    
                    console.error(`❌ Ошибка в шаге ${i + 1}:`, error.message);
                }
                
                results.steps.push(stepResult);
                
                // Если шаг не выполнен, останавливаем сценарий
                if (!stepResult.success) {
                    console.log(`⏹️ Остановка сценария из-за ошибки в шаге ${i + 1}`);
                    break;
                }
            }
            
            results.endTime = new Date();
            results.duration = results.endTime - results.startTime;
            results.success = results.errorCount === 0;
            
            console.log(`\n${results.success ? '✅' : '❌'} Сценарий завершен: ${scenario.name}`);
            console.log(`📊 Результат: ${results.steps.filter(s => s.success).length}/${results.steps.length} шагов выполнено`);
            console.log(`⏱️ Время выполнения: ${(results.duration / 1000).toFixed(1)}с`);
            
            return results;
            
        } catch (error) {
            console.error(`❌ Критическая ошибка в сценарии "${scenario.name}":`, error.message);
            
            results.endTime = new Date();
            results.duration = results.endTime - results.startTime;
            results.success = false;
            results.error = error.message;
            
            return results;
        }
    }

    async saveErrorInfo(step, error) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            step: step,
            error: error.message,
            stack: error.stack,
            currentState: this.currentState,
            screenshotPath: await this.takeScreenshot('error_state')
        };
        
        const errorFile = require('path').join(this.logDir, `react_error_${Date.now()}.json`);
        require('fs').writeFileSync(errorFile, JSON.stringify(errorInfo, null, 2));
        
        console.log(`💾 Информация об ошибке сохранена: ${errorFile}`);
    }

    async generateReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            bot: 'ReactIntegratedBot',
            results: results,
            stateHistory: this.stateHistory,
            summary: {
                totalScenarios: results.length,
                successfulScenarios: results.filter(r => r.success).length,
                failedScenarios: results.filter(r => !r.success).length,
                totalSteps: results.reduce((sum, r) => sum + r.steps.length, 0),
                successfulSteps: results.reduce((sum, r) => sum + r.steps.filter(s => s.success).length, 0),
                totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
            }
        };
        
        const reportFile = require('path').join(this.logDir, `react_integrated_report_${Date.now()}.json`);
        require('fs').writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`📊 Отчет сохранен: ${reportFile}`);
        return report;
    }

    async pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('🧹 Браузер закрыт');
            }
        } catch (error) {
            console.error('❌ Ошибка при очистке:', error.message);
        }
    }
}

module.exports = { ReactIntegratedBot }; 