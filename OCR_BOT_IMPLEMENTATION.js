const puppeteer = require('puppeteer');
const tesseract = require('node-tesseract-ocr');
const fs = require('fs').promises;
const path = require('path');

/**
 * Универсальный OCR бот для тестирования веб-приложений
 */
class OCRBot {
  constructor(config = {}) {
    this.config = {
      browser: {
        headless: false,
        slowMo: 100,
        defaultViewport: { width: 1920, height: 1080 }
      },
      devices: {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 375, height: 667 }
      },
      urls: {
        base: 'http://localhost:3000',
        api: 'http://localhost:8000/api'
      },
      timeouts: {
        pageLoad: 30000,
        elementWait: 10000,
        actionDelay: 1000
      },
      ocr: {
        language: 'rus+eng',
        confidence: 0.8
      },
      ...config
    };
    
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.screenshots = [];
    this.currentTest = null;
    this.testResults = [];
  }

  /**
   * Инициализация бота
   */
  async init(device = 'desktop') {
    try {
      console.log(`🚀 Инициализация OCR бота для устройства: ${device}`);
      
      // Запуск браузера
      this.browser = await puppeteer.launch({
        headless: this.config.browser.headless,
        slowMo: this.config.browser.slowMo,
        defaultViewport: this.config.devices[device] || this.config.browser.defaultViewport,
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

      // Создание новой страницы
      this.page = await this.browser.newPage();
      
      // Настройка таймаутов
      this.page.setDefaultTimeout(this.config.timeouts.elementWait);
      this.page.setDefaultNavigationTimeout(this.config.timeouts.pageLoad);
      
      // Перехват консольных сообщений
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error('Browser Error:', msg.text());
        }
      });

      // Перехват ошибок страницы
      this.page.on('pageerror', error => {
        console.error('Page Error:', error.message);
        this.errors.push({
          type: 'page_error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      });

      console.log('✅ OCR бот инициализирован');
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации OCR бота:', error);
      throw error;
    }
  }

  /**
   * Создание скриншота
   */
  async takeScreenshot(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}_${timestamp}.png`;
      const filepath = path.join(__dirname, 'reports', 'screenshots', filename);
      
      // Создание директории если не существует
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      // Создание скриншота
      await this.page.screenshot({
        path: filepath,
        fullPage: true
      });
      
      this.screenshots.push({
        name,
        filepath,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📸 Скриншот сохранен: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ Ошибка создания скриншота:', error);
      throw error;
    }
  }

  /**
   * OCR распознавание текста
   */
  async recognizeText(imagePath) {
    try {
      const config = {
        lang: this.config.ocr.language,
        oem: 1,
        psm: 3,
      };
      
      const text = await tesseract.recognize(imagePath, config);
      return text.trim();
    } catch (error) {
      console.error('❌ Ошибка OCR распознавания:', error);
      return '';
    }
  }

  /**
   * Поиск текста на странице
   */
  async findText(text, timeout = 5000) {
    try {
      console.log(`🔍 Поиск текста: "${text}"`);
      
      // Создание скриншота для OCR
      const screenshotPath = await this.takeScreenshot(`search_${text.replace(/\s+/g, '_')}`);
      
      // OCR распознавание
      const recognizedText = await this.recognizeText(screenshotPath);
      
      // Проверка наличия текста
      const found = recognizedText.toLowerCase().includes(text.toLowerCase());
      
      if (found) {
        console.log(`✅ Текст найден: "${text}"`);
        return {
          found: true,
          text: recognizedText,
          screenshot: screenshotPath
        };
      } else {
        console.log(`❌ Текст не найден: "${text}"`);
        console.log(`📝 Распознанный текст: "${recognizedText}"`);
        return {
          found: false,
          text: recognizedText,
          screenshot: screenshotPath
        };
      }
    } catch (error) {
      console.error('❌ Ошибка поиска текста:', error);
      return { found: false, error: error.message };
    }
  }

  /**
   * Клик по элементу с текстом
   */
  async clickText(text, timeout = 5000) {
    try {
      console.log(`🖱️ Клик по тексту: "${text}"`);
      
      // Поиск текста
      const searchResult = await this.findText(text, timeout);
      
      if (!searchResult.found) {
        throw new Error(`Текст "${text}" не найден на странице`);
      }
      
      // Попытка клика через CSS селекторы
      const selectors = [
        `text="${text}"`,
        `text*="${text}"`,
        `text~="${text}"`,
        `text^="${text}"`,
        `text$="${text}"`
      ];
      
      for (const selector of selectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          await this.page.click(selector);
          console.log(`✅ Клик выполнен по селектору: ${selector}`);
          return true;
        } catch (e) {
          // Продолжаем поиск
        }
      }
      
      // Если CSS селекторы не сработали, используем координаты
      console.log('⚠️ CSS селекторы не сработали, используем координаты');
      
      // Здесь должна быть логика определения координат текста
      // Пока что просто ждем и пробуем кликнуть в центр
      await this.page.waitForTimeout(1000);
      await this.page.click('body');
      
      return true;
    } catch (error) {
      console.error(`❌ Ошибка клика по тексту "${text}":`, error);
      throw error;
    }
  }

  /**
   * Ввод текста в поле
   */
  async typeText(placeholder, text) {
    try {
      console.log(`⌨️ Ввод текста в поле "${placeholder}": "${text}"`);
      
      // Поиск поля ввода
      const inputSelectors = [
        `input[placeholder*="${placeholder}"]`,
        `textarea[placeholder*="${placeholder}"]`,
        `input[aria-label*="${placeholder}"]`,
        `textarea[aria-label*="${placeholder}"]`
      ];
      
      let inputElement = null;
      for (const selector of inputSelectors) {
        try {
          inputElement = await this.page.$(selector);
          if (inputElement) break;
        } catch (e) {
          // Продолжаем поиск
        }
      }
      
      if (!inputElement) {
        throw new Error(`Поле ввода с placeholder "${placeholder}" не найдено`);
      }
      
      // Очистка поля и ввод текста
      await inputElement.click();
      await inputElement.type(text);
      
      console.log(`✅ Текст введен: "${text}"`);
      return true;
    } catch (error) {
      console.error(`❌ Ошибка ввода текста в поле "${placeholder}":`, error);
      throw error;
    }
  }

  /**
   * Ожидание появления элемента
   */
  async waitForElement(text, timeout = 10000) {
    try {
      console.log(`⏳ Ожидание элемента: "${text}"`);
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        const searchResult = await this.findText(text, 1000);
        if (searchResult.found) {
          console.log(`✅ Элемент появился: "${text}"`);
          return true;
        }
        await this.page.waitForTimeout(500);
      }
      
      throw new Error(`Элемент "${text}" не появился за ${timeout}ms`);
    } catch (error) {
      console.error(`❌ Ошибка ожидания элемента "${text}":`, error);
      throw error;
    }
  }

  /**
   * Выполнение шага теста
   */
  async executeStep(step, bot) {
    const stepResult = {
      name: step.name,
      status: 'pending',
      startTime: new Date().toISOString(),
      endTime: null,
      error: null,
      screenshot: null
    };
    
    try {
      console.log(`\n📋 Выполнение шага: ${step.name}`);
      
      // Выполнение действия
      if (step.action) {
        await step.action(bot);
      }
      
      // Ожидание если указано
      if (step.wait) {
        await this.page.waitForTimeout(step.wait);
      }
      
      // Проверка ожидаемого результата
      if (step.expected) {
        const searchResult = await this.findText(step.expected);
        if (!searchResult.found) {
          throw new Error(`Ожидаемый результат не найден: "${step.expected}"`);
        }
      }
      
      // Создание скриншота результата
      stepResult.screenshot = await this.takeScreenshot(`step_${step.name.replace(/\s+/g, '_')}`);
      
      stepResult.status = 'passed';
      stepResult.endTime = new Date().toISOString();
      
      console.log(`✅ Шаг выполнен успешно: ${step.name}`);
      
    } catch (error) {
      stepResult.status = 'failed';
      stepResult.error = error.message;
      stepResult.endTime = new Date().toISOString();
      
      // Создание скриншота ошибки
      stepResult.screenshot = await this.takeScreenshot(`error_${step.name.replace(/\s+/g, '_')}`);
      
      console.error(`❌ Ошибка в шаге "${step.name}":`, error.message);
      
      this.errors.push({
        step: step.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return stepResult;
  }

  /**
   * Выполнение сценария тестирования
   */
  async runScenario(scenario) {
    console.log(`\n🎬 Запуск сценария: ${scenario.name}`);
    
    const scenarioResult = {
      name: scenario.name,
      startTime: new Date().toISOString(),
      endTime: null,
      steps: [],
      status: 'pending',
      errors: []
    };
    
    try {
      // Навигация на начальную страницу
      if (scenario.startUrl) {
        console.log(`🌐 Переход на: ${scenario.startUrl}`);
        await this.page.goto(scenario.startUrl, { waitUntil: 'networkidle0' });
      }
      
      // Выполнение шагов
      for (const step of scenario.steps) {
        const stepResult = await this.executeStep(step, this);
        scenarioResult.steps.push(stepResult);
        
        // Если шаг провалился, останавливаем сценарий
        if (stepResult.status === 'failed') {
          scenarioResult.status = 'failed';
          break;
        }
      }
      
      if (scenarioResult.status !== 'failed') {
        scenarioResult.status = 'passed';
      }
      
    } catch (error) {
      scenarioResult.status = 'failed';
      scenarioResult.errors.push(error.message);
      console.error(`❌ Ошибка выполнения сценария "${scenario.name}":`, error);
    }
    
    scenarioResult.endTime = new Date().toISOString();
    this.testResults.push(scenarioResult);
    
    console.log(`🏁 Сценарий завершен: ${scenario.name} - ${scenarioResult.status}`);
    
    return scenarioResult;
  }

  /**
   * Генерация отчета
   */
  async generateReport() {
    console.log('\n📊 Генерация отчета...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalScenarios: this.testResults.length,
        passedScenarios: this.testResults.filter(r => r.status === 'passed').length,
        failedScenarios: this.testResults.filter(r => r.status === 'failed').length,
        totalSteps: this.testResults.reduce((sum, r) => sum + r.steps.length, 0),
        passedSteps: this.testResults.reduce((sum, r) => sum + r.steps.filter(s => s.status === 'passed').length, 0),
        failedSteps: this.testResults.reduce((sum, r) => sum + r.steps.filter(s => s.status === 'failed').length, 0)
      },
      scenarios: this.testResults,
      errors: this.errors,
      screenshots: this.screenshots,
      recommendations: this.generateRecommendations()
    };
    
    // Сохранение отчета в JSON
    const reportPath = path.join(__dirname, 'reports', `report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Генерация HTML отчета
    await this.generateHTMLReport(report);
    
    console.log(`📄 Отчет сохранен: ${reportPath}`);
    
    return report;
  }

  /**
   * Генерация рекомендаций
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.errors.length > 0) {
      recommendations.push({
        type: 'error',
        message: `Найдено ${this.errors.length} ошибок. Необходимо исправить проблемы в коде.`,
        priority: 'high'
      });
    }
    
    const failedScenarios = this.testResults.filter(r => r.status === 'failed');
    if (failedScenarios.length > 0) {
      recommendations.push({
        type: 'scenario',
        message: `${failedScenarios.length} сценариев провалились. Проверьте функциональность.`,
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Генерация HTML отчета
   */
  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>OCR Bot Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .scenario { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .step { margin: 10px 0; padding: 10px; background: #f9f9f9; }
        .error { color: #f44336; }
        .screenshot { max-width: 300px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>OCR Bot Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Scenarios: ${report.summary.totalScenarios}</p>
        <p>Passed: ${report.summary.passedScenarios}</p>
        <p>Failed: ${report.summary.failedScenarios}</p>
        <p>Total Steps: ${report.summary.totalSteps}</p>
        <p>Passed Steps: ${report.summary.passedSteps}</p>
        <p>Failed Steps: ${report.summary.failedSteps}</p>
    </div>
    
    <h2>Scenarios</h2>
    ${report.scenarios.map(scenario => `
        <div class="scenario ${scenario.status}">
            <h3>${scenario.name} - ${scenario.status}</h3>
            <p>Duration: ${new Date(scenario.endTime) - new Date(scenario.startTime)}ms</p>
            ${scenario.steps.map(step => `
                <div class="step ${step.status}">
                    <h4>${step.name} - ${step.status}</h4>
                    ${step.error ? `<p class="error">Error: ${step.error}</p>` : ''}
                    ${step.screenshot ? `<img src="${step.screenshot}" class="screenshot" alt="Screenshot">` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
    
    <h2>Errors</h2>
    ${report.errors.map(error => `
        <div class="error">
            <p><strong>${error.step || 'Unknown'}</strong>: ${error.error}</p>
            <p>Time: ${error.timestamp}</p>
        </div>
    `).join('')}
    
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
        <div class="recommendation">
            <p><strong>${rec.type}</strong>: ${rec.message}</p>
            <p>Priority: ${rec.priority}</p>
        </div>
    `).join('')}
</body>
</html>
    `;
    
    const htmlPath = path.join(__dirname, 'reports', `report_${new Date().toISOString().replace(/[:.]/g, '-')}.html`);
    await fs.writeFile(htmlPath, html);
    
    console.log(`🌐 HTML отчет создан: ${htmlPath}`);
  }

  /**
   * Очистка ресурсов
   */
  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('🔒 Браузер закрыт');
      }
    } catch (error) {
      console.error('❌ Ошибка при закрытии браузера:', error);
    }
  }
}

module.exports = OCRBot; 