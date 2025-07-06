const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const settings = require('./config/settings');
const scenarios = require('./config/scenarios');
const actions = require('./actions/interactions');
const navigation = require('./actions/navigation');
const utils = require('./actions/utils');
const reportGenerator = require('./reports/generator');

class ScreenshotModule {
    constructor(options = {}) {
        this.settings = { ...settings, ...options };
        this.browser = null;
        this.page = null;
        this.screenshots = [];
        this.errors = [];
        this.warnings = [];
        this.logger = new utils.Logger(this.settings.logging);
    }

    async init() {
        this.logger.info('🚀 Инициализация модуля создания скриншотов...');
        
        // Создаем необходимые папки
        await this.createDirectories();
        
        // Запускаем браузер
        this.browser = await puppeteer.launch({
            headless: this.settings.headless,
            defaultViewport: this.settings.viewport,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Устанавливаем обработчики ошибок
        this.page.on('error', (error) => {
            this.logger.error(`Ошибка страницы: ${error.message}`);
            this.errors.push({ type: 'page_error', message: error.message });
        });
        
        this.page.on('pageerror', (error) => {
            this.logger.error(`JavaScript ошибка: ${error.message}`);
            this.errors.push({ type: 'js_error', message: error.message });
        });
        
        this.logger.info('✅ Модуль инициализирован');
    }

    async createDirectories() {
        const dirs = [
            this.settings.outputDir,
            path.join(this.settings.outputDir, this.settings.folders.states),
            path.join(this.settings.outputDir, this.settings.folders.components),
            path.join(this.settings.outputDir, this.settings.folders.interactions),
            path.join(this.settings.outputDir, this.settings.folders.multiuser),
            path.join(this.settings.outputDir, this.settings.folders.elements),
            path.join(this.settings.outputDir, this.settings.folders.errors),
            path.join(this.settings.outputDir, this.settings.folders.logs),
            path.join(this.settings.outputDir, this.settings.folders.reports),
            // Подпапки для элементов
            path.join(this.settings.outputDir, this.settings.folders.elements, this.settings.elementSubfolders.buttons),
            path.join(this.settings.outputDir, this.settings.folders.elements, this.settings.elementSubfolders.inputs),
            path.join(this.settings.outputDir, this.settings.folders.elements, this.settings.elementSubfolders.menus),
            path.join(this.settings.outputDir, this.settings.folders.elements, this.settings.elementSubfolders.icons),
            path.join(this.settings.outputDir, this.settings.folders.elements, this.settings.elementSubfolders.text),
            path.join(this.settings.outputDir, this.settings.folders.elements, this.settings.elementSubfolders.forms),
            path.join(this.settings.outputDir, this.settings.folders.elements, this.settings.elementSubfolders.modals)
        ];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                this.logger.info(`📁 Создана папка: ${dir}`);
            }
        }
    }

    async takeScreenshot(name, folder, description = '') {
        try {
            const filename = `${name}.png`;
            const folderPath = path.join(this.settings.outputDir, folder);
            const filepath = path.join(folderPath, filename);
            
            // Создаем папку если не существует
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            
            await this.page.screenshot({
                path: filepath,
                ...this.settings.screenshotOptions
            });
            
            const screenshotInfo = {
                name,
                filename,
                folder,
                filepath,
                description,
                timestamp: new Date().toISOString(),
                size: fs.statSync(filepath).size
            };
            
            this.screenshots.push(screenshotInfo);
            this.logger.info(`📸 Скриншот: ${filename} - ${description}`);
            
            return screenshotInfo;
        } catch (error) {
            this.logger.error(`❌ Ошибка создания скриншота ${name}: ${error.message}`);
            this.errors.push({ type: 'screenshot_error', name, message: error.message });
            return null;
        }
    }

    async executeScenario(scenario) {
        this.logger.info(`🎬 Выполнение сценария: ${scenario.name} - ${scenario.description}`);
        
        try {
            // Выполняем действие
            const action = actions[scenario.action] || navigation[scenario.action];
            if (action) {
                await action(this.page, (name, description) => 
                    this.takeScreenshot(name, scenario.folder, description)
                );
            } else {
                throw new Error(`Действие ${scenario.action} не найдено`);
            }
            
            // Ждем после действия
            await utils.delay(this.settings.delay);
            
        } catch (error) {
            this.logger.error(`❌ Ошибка в сценарии ${scenario.name}: ${error.message}`);
            this.errors.push({ 
                type: 'scenario_error', 
                scenario: scenario.name, 
                message: error.message 
            });
            
            // Создаем скриншот ошибки
            await this.takeScreenshot(
                `error_${scenario.name}`, 
                this.settings.folders.errors, 
                `Ошибка в сценарии: ${scenario.description}`
            );
        }
    }

    async runScenarios(scenarioType = 'all') {
        this.logger.info(`🎯 Запуск сценариев типа: ${scenarioType}`);
        
        let scenariosToRun = [];
        
        if (scenarioType === 'all') {
            // Объединяем все сценарии
            Object.values(scenarios).forEach(category => {
                scenariosToRun = scenariosToRun.concat(category);
            });
        } else if (scenarios[scenarioType]) {
            scenariosToRun = scenarios[scenarioType];
        } else {
            throw new Error(`Неизвестный тип сценария: ${scenarioType}`);
        }
        
        // Сортируем по приоритету
        scenariosToRun.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        this.logger.info(`📋 Найдено сценариев: ${scenariosToRun.length}`);
        
        // Выполняем сценарии
        for (const scenario of scenariosToRun) {
            await this.executeScenario(scenario);
        }
    }

    async captureElementsForOCR() {
        if (!this.settings.ocr.enabled) return;
        
        this.logger.info('🎯 Создание скриншотов элементов для OCR...');
        
        const elementsMetadata = [];
        
        // Находим все кнопки
        const buttons = await this.page.$$('button, .MuiButtonBase-root, [role="button"]');
        for (let i = 0; i < buttons.length; i++) {
            try {
                const button = buttons[i];
                const text = await this.page.evaluate(el => el.textContent?.trim(), button);
                const selector = await this.page.evaluate(el => {
                    if (el.id) return `#${el.id}`;
                    if (el.className) return `.${el.className.split(' ').join('.')}`;
                    return el.tagName.toLowerCase();
                }, button);
                
                if (text) {
                    const name = `button_${i}_${text.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    const screenshotInfo = await this.takeScreenshot(
                        name,
                        path.join(this.settings.folders.elements, this.settings.elementSubfolders.buttons),
                        `Кнопка: ${text}`
                    );
                    
                    if (screenshotInfo) {
                        elementsMetadata.push({
                            element: 'button',
                            text,
                            selector,
                            screenshot: screenshotInfo.filepath,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } catch (error) {
                this.logger.warn(`⚠️ Ошибка при создании скриншота кнопки ${i}: ${error.message}`);
            }
        }
        
        // Сохраняем метаданные
        if (this.settings.ocr.generateMetadata && elementsMetadata.length > 0) {
            const metadataPath = path.join(this.settings.outputDir, this.settings.ocr.metadataFile);
            fs.writeFileSync(metadataPath, JSON.stringify(elementsMetadata, null, 2));
            this.logger.info(`💾 Метаданные сохранены: ${metadataPath}`);
        }
    }

    async generateReports() {
        this.logger.info('📊 Генерация отчетов...');
        
        const reportData = {
            timestamp: new Date().toISOString(),
            totalScreenshots: this.screenshots.length,
            categories: {},
            quality: this.settings.quality,
            errors: this.errors,
            warnings: this.warnings
        };
        
        // Группируем скриншоты по категориям
        this.screenshots.forEach(screenshot => {
            const category = screenshot.folder.split('/')[0];
            if (!reportData.categories[category]) {
                reportData.categories[category] = [];
            }
            reportData.categories[category].push(screenshot);
        });
        
        // Генерируем отчеты
        if (this.settings.reports.generateJson) {
            await reportGenerator.generateJsonReport(reportData, this.settings);
        }
        
        if (this.settings.reports.generateHtml) {
            await reportGenerator.generateHtmlReport(reportData, this.settings);
        }
        
        if (this.settings.reports.generateAnalysis) {
            await reportGenerator.generateAnalysisReport(reportData, this.settings);
        }
        
        this.logger.info('✅ Отчеты сгенерированы');
    }

    async run(options = {}) {
        const startTime = Date.now();
        
        try {
            await this.init();
            
            // Переходим на главную страницу
            await navigation.navigateToMain(this.page);
            
            // Определяем тип сценариев для запуска
            const scenarioType = options.scenario || 'all';
            await this.runScenarios(scenarioType);
            
            // Создаем скриншоты элементов для OCR
            if (options.ocr !== false) {
                await this.captureElementsForOCR();
            }
            
            // Генерируем отчеты
            await this.generateReports();
            
            const duration = Date.now() - startTime;
            this.logger.info(`🎉 Модуль завершен за ${duration}ms`);
            this.logger.info(`📸 Создано скриншотов: ${this.screenshots.length}`);
            this.logger.info(`❌ Ошибок: ${this.errors.length}`);
            this.logger.info(`⚠️ Предупреждений: ${this.warnings.length}`);
            
        } catch (error) {
            this.logger.error(`💥 Критическая ошибка: ${error.message}`);
            this.errors.push({ type: 'critical_error', message: error.message });
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
        
        return {
            screenshots: this.screenshots,
            errors: this.errors,
            warnings: this.warnings
        };
    }
}

// CLI интерфейс
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Парсим аргументы командной строки
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--scenario' && args[i + 1]) {
            options.scenario = args[i + 1];
            i++;
        } else if (arg === '--headless') {
            options.headless = true;
        } else if (arg === '--mobile') {
            options.viewport = settings.mobileViewport;
        } else if (arg === '--quality' && args[i + 1]) {
            options.quality = args[i + 1];
            i++;
        } else if (arg === '--help') {
            console.log(`
📸 Модуль создания скриншотов для документации

Использование:
  node screenshot-module/index.js [опции]

Опции:
  --scenario <тип>     Тип сценариев (states, components, interactions, multiuser, elements, errors, all)
  --headless          Запуск браузера в фоновом режиме
  --mobile           Использовать мобильное разрешение
  --quality <level>  Качество скриншотов (low, medium, high)
  --help             Показать эту справку

Примеры:
  node screenshot-module/index.js --scenario states
  node screenshot-module/index.js --scenario components --headless
  node screenshot-module/index.js --mobile --quality high
            `);
            return;
        }
    }
    
    const module = new ScreenshotModule(options);
    await module.run(options);
}

// Экспорт для использования как модуль
module.exports = ScreenshotModule;

// Запуск если файл вызван напрямую
if (require.main === module) {
    main().catch(console.error);
} 