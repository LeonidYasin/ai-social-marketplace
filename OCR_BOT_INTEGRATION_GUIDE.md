# Руководство по интеграции OCR Бота

## Обзор

OCR Бот - это автономный модуль для визуального тестирования веб-приложений, который может быть интегрирован в основной проект Social Marketplace для автоматизированного тестирования всех пользовательских сценариев.

## Структура модуля

```
ocr-bot/
├── OCR_BOT_IMPLEMENTATION.js    # Основная реализация бота
├── TEST_SCENARIOS.js            # Готовые сценарии тестирования
├── RUN_OCR_TESTS.js             # Запуск тестов
├── FRONTEND_BACKEND_INTERACTION.md  # Документация взаимодействия
├── MULTIUSER_SCENARIOS.md       # Многопользовательские сценарии
├── OCR_BOT_TESTING_MODULE.md    # Документация модуля
├── ocr-bot-package.json         # Зависимости
├── reports/                     # Отчеты тестирования
│   ├── screenshots/             # Скриншоты
│   ├── logs/                    # Логи
│   └── reports/                 # Отчеты
└── tessdata/                    # Данные для OCR
    ├── eng.traineddata          # Английский язык
    └── rus.traineddata          # Русский язык
```

## Установка и настройка

### 1. Установка зависимостей

```bash
# Клонирование или копирование файлов OCR бота
cd ocr-bot

# Установка Node.js зависимостей
npm install

# Установка Tesseract OCR
npm run install:tesseract

# Или полная настройка
npm run setup
```

### 2. Настройка Tesseract OCR

#### Windows
```powershell
# Установка через Chocolatey
choco install tesseract

# Или скачивание с официального сайта
# https://github.com/UB-Mannheim/tesseract/wiki
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-rus tesseract-ocr-eng
```

#### macOS
```bash
brew install tesseract tesseract-lang
```

### 3. Настройка языковых данных

```bash
# Создание директории для языковых данных
mkdir -p tessdata

# Копирование файлов языковых данных
cp /usr/share/tessdata/eng.traineddata tessdata/
cp /usr/share/tessdata/rus.traineddata tessdata/
```

## Использование

### Базовые команды

```bash
# Запуск всех тестов
npm test

# Запуск базовых сценариев
npm run test:basic

# Запуск продвинутых сценариев
npm run test:advanced

# Запуск тестов аутентификации
npm run test:auth

# Запуск тестов постов
npm run test:post

# Запуск тестов чата
npm run test:chat

# Запуск многопользовательских тестов
npm run test:multiuser
```

### Продвинутые опции

```bash
# Тестирование на мобильном устройстве
npm run test:mobile

# Запуск в фоновом режиме
npm run test:headless

# Замедленное выполнение для отладки
npm run test:slow

# Просмотр отчета
npm run report

# Очистка отчетов
npm run clean
```

### Прямое использование

```bash
# Запуск с параметрами
node RUN_OCR_TESTS.js --device mobile --scenarios basic

# Запуск конкретного сценария
node RUN_OCR_TESTS.js --scenarios auth --headless

# Запуск с замедлением
node RUN_OCR_TESTS.js --slow 200 --scenarios all

# Просмотр справки
node RUN_OCR_TESTS.js --help
```

## Интеграция с основным проектом

### 1. Добавление в package.json основного проекта

```json
{
  "scripts": {
    "test:ocr": "cd ocr-bot && npm test",
    "test:ocr:basic": "cd ocr-bot && npm run test:basic",
    "test:ocr:auth": "cd ocr-bot && npm run test:auth",
    "test:ocr:multiuser": "cd ocr-bot && npm run test:multiuser",
    "test:ocr:report": "cd ocr-bot && npm run report"
  }
}
```

### 2. Интеграция с CI/CD

#### GitHub Actions
```yaml
name: OCR Tests
on: [push, pull_request]

jobs:
  ocr-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          npm install
          cd ocr-bot && npm install
          
      - name: Install Tesseract
        run: |
          sudo apt-get update
          sudo apt-get install -y tesseract-ocr tesseract-ocr-rus tesseract-ocr-eng
          
      - name: Start backend
        run: |
          cd backend && npm start &
          sleep 10
          
      - name: Start frontend
        run: |
          cd frontend && npm start &
          sleep 15
          
      - name: Run OCR tests
        run: |
          cd ocr-bot && npm run test:headless
          
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: ocr-test-reports
          path: ocr-bot/reports/
```

#### GitLab CI
```yaml
ocr_tests:
  stage: test
  image: node:18
  before_script:
    - apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-rus tesseract-ocr-eng
    - npm install
    - cd ocr-bot && npm install
  script:
    - cd backend && npm start &
    - sleep 10
    - cd frontend && npm start &
    - sleep 15
    - cd ocr-bot && npm run test:headless
  artifacts:
    paths:
      - ocr-bot/reports/
    expire_in: 1 week
```

### 3. Интеграция с мониторингом

```javascript
// monitoring/ocr-tests.js
const { runTests } = require('../ocr-bot/RUN_OCR_TESTS');

class OCRTestMonitor {
  constructor() {
    this.lastRun = null;
    this.results = [];
  }
  
  async runScheduledTests() {
    try {
      console.log('🔄 Запуск запланированных OCR тестов...');
      
      const results = await runTests();
      
      this.lastRun = new Date();
      this.results.push({
        timestamp: this.lastRun,
        results: results
      });
      
      // Отправка уведомлений при ошибках
      if (results.summary.failedScenarios > 0) {
        await this.sendAlert(results);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Ошибка выполнения OCR тестов:', error);
      await this.sendAlert({ error: error.message });
    }
  }
  
  async sendAlert(data) {
    // Отправка уведомления в Slack/Telegram/Email
    console.log('🚨 Отправка уведомления об ошибках:', data);
  }
}

module.exports = OCRTestMonitor;
```

## Настройка сценариев

### 1. Создание нового сценария

```javascript
// TEST_SCENARIOS.js
const customScenario = {
  name: 'Custom Feature Test',
  startUrl: 'http://localhost:3000',
  steps: [
    {
      name: 'Открытие страницы',
      action: async (bot) => {
        await bot.page.waitForTimeout(2000);
      },
      expected: 'Заголовок страницы',
      wait: 1000
    },
    {
      name: 'Выполнение действия',
      action: async (bot) => {
        await bot.clickText('Кнопка действия');
      },
      expected: 'Результат действия',
      wait: 2000
    }
  ]
};

// Добавление в экспорт
module.exports = {
  // ... существующие сценарии
  customScenario,
  allScenarios: [
    // ... существующие сценарии
    customScenario
  ]
};
```

### 2. Настройка конфигурации

```javascript
// config/custom-config.js
module.exports = {
  browser: {
    headless: false,
    slowMo: 100,
    defaultViewport: { width: 1920, height: 1080 }
  },
  devices: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 }
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
  }
};
```

## Мониторинг и отчетность

### 1. Структура отчетов

```
reports/
├── report_2024-01-01T12-00-00-000Z.json    # JSON отчет
├── report_2024-01-01T12-00-00-000Z.html    # HTML отчет
├── screenshots/                             # Скриншоты
│   ├── step_1_initial.png
│   ├── step_2_after_action.png
│   └── error_step_3.png
└── logs/                                    # Логи
    └── test_2024-01-01T12-00-00-000Z.log
```

### 2. Анализ результатов

```javascript
// analysis/ocr-results.js
const fs = require('fs').promises;
const path = require('path');

class OCRResultsAnalyzer {
  async analyzeResults(reportPath) {
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    
    return {
      summary: report.summary,
      trends: this.analyzeTrends(report),
      recommendations: this.generateRecommendations(report),
      performance: this.analyzePerformance(report)
    };
  }
  
  analyzeTrends(report) {
    // Анализ трендов по времени
    return {
      successRate: this.calculateSuccessRate(report),
      commonErrors: this.findCommonErrors(report),
      performanceTrends: this.analyzePerformanceTrends(report)
    };
  }
  
  generateRecommendations(report) {
    const recommendations = [];
    
    if (report.summary.failedScenarios > 0) {
      recommendations.push({
        type: 'critical',
        message: 'Исправить провалившиеся сценарии',
        priority: 'high'
      });
    }
    
    return recommendations;
  }
}

module.exports = OCRResultsAnalyzer;
```

## Устранение неполадок

### 1. Частые проблемы

#### OCR не распознает текст
```bash
# Проверка установки Tesseract
tesseract --version

# Проверка языковых данных
ls /usr/share/tessdata/

# Увеличение confidence
# В конфигурации: confidence: 0.6
```

#### Браузер не запускается
```bash
# Установка зависимостей
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

#### Тесты падают на CI
```bash
# Увеличение таймаутов
# В конфигурации:
timeouts: {
  pageLoad: 60000,
  elementWait: 20000
}

# Запуск в headless режиме
npm run test:headless
```

### 2. Отладка

```bash
# Запуск с подробным логированием
DEBUG=* node RUN_OCR_TESTS.js --scenarios auth

# Запуск с замедлением для отладки
node RUN_OCR_TESTS.js --slow 500 --scenarios basic

# Просмотр скриншотов ошибок
open reports/screenshots/error_*
```

## Расширение функциональности

### 1. Добавление новых устройств

```javascript
// В конфигурации
devices: {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  largeDesktop: { width: 2560, height: 1440 }
}
```

### 2. Добавление новых действий

```javascript
// В OCR_BOT_IMPLEMENTATION.js
class OCRBot {
  async dragAndDrop(sourceText, targetText) {
    // Реализация drag and drop
  }
  
  async hoverText(text) {
    // Реализация hover
  }
  
  async selectOption(selectText, optionText) {
    // Реализация выбора опции
  }
}
```

### 3. Интеграция с внешними сервисами

```javascript
// Интеграция с Slack
async sendSlackNotification(results) {
  const webhook = process.env.SLACK_WEBHOOK;
  if (webhook && results.summary.failedScenarios > 0) {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `❌ OCR тесты провалились: ${results.summary.failedScenarios} сценариев`
      })
    });
  }
}
```

## Заключение

OCR Бот предоставляет мощный инструмент для автоматизированного тестирования веб-приложений с использованием компьютерного зрения. Его интеграция в проект Social Marketplace позволит:

1. **Автоматизировать тестирование** всех пользовательских сценариев
2. **Выявлять визуальные проблемы** интерфейса
3. **Обеспечить качество** на всех этапах разработки
4. **Ускорить процесс тестирования** и развертывания
5. **Получать подробные отчеты** о состоянии системы

Модуль готов к использованию и может быть легко интегрирован в существующий процесс разработки. 