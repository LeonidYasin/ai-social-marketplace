# 📸 Модуль создания скриншотов для документации

## 🎯 Назначение

Этот модуль создает качественные скриншоты всех элементов интерфейса для:
- **Документации UI** - визуальное описание всех экранов
- **OCR бота** - обучение распознаванию элементов интерфейса
- **Тестирования** - проверка корректности отображения
- **Анализа** - изучение структуры приложения

## 📁 Структура модуля

```
screenshot-module/
├── README.md                    # Этот файл
├── config/
│   ├── scenarios.js             # Конфигурация сценариев съемки
│   ├── selectors.js             # CSS селекторы элементов
│   └── settings.js              # Настройки браузера и путей
├── actions/
│   ├── navigation.js            # Действия навигации
│   ├── interactions.js          # Взаимодействия с элементами
│   └── utils.js                 # Утилиты для работы с браузером
├── scenarios/
│   ├── states.js                # Сценарии состояний приложения
│   ├── components.js            # Сценарии компонентов UI
│   ├── interactions.js          # Сценарии взаимодействий
│   └── multiuser.js             # Мультипользовательские сценарии
├── reports/
│   ├── generator.js             # Генератор отчетов
│   └── templates/               # Шаблоны отчетов
└── index.js                     # Главный файл модуля
```

## 🚀 Быстрый запуск

### 1. Запуск всех скриншотов
```bash
node screenshot-module/index.js
```

### 2. Запуск конкретного сценария
```bash
node screenshot-module/index.js --scenario states
node screenshot-module/index.js --scenario components
node screenshot-module/index.js --scenario interactions
node screenshot-module/index.js --scenario multiuser
```

### 3. Запуск с параметрами
```bash
node screenshot-module/index.js --headless --mobile --quality high
```

## 📸 Структура скриншотов

Все скриншоты сохраняются в `documentation_screenshots/` со следующей структурой:

```
documentation_screenshots/
├── states/                      # Состояния приложения
│   ├── 01_initial_page.png      # Начальная страница
│   ├── 02_guest_mode.png        # Гостевой режим
│   ├── 03_login_form.png        # Форма входа
│   └── ...
├── components/                   # Компоненты UI
│   ├── 01_appbar.png            # Верхняя панель
│   ├── 02_sidebar_left.png      # Левая панель
│   ├── 03_sidebar_right.png     # Правая панель
│   └── ...
├── interactions/                 # Взаимодействия
│   ├── 01_before_like.png       # До лайка
│   ├── 02_after_like.png        # После лайка
│   └── ...
├── multiuser/                    # Мультипользовательские
│   ├── 01_user1_initial.png     # Пользователь 1
│   ├── 02_user2_initial.png     # Пользователь 2
│   └── ...
├── elements/                     # Отдельные элементы (для OCR)
│   ├── buttons/                  # Кнопки
│   ├── inputs/                   # Поля ввода
│   ├── menus/                    # Меню
│   └── ...
├── errors/                       # Состояния ошибок
├── logs/                         # Логи выполнения
└── reports/                      # Отчеты
    ├── screenshot_list.json      # Список всех скриншотов
    ├── documentation.html        # HTML документация
    └── analysis_report.json      # Отчет анализа
```

## ⚙️ Конфигурация

### Настройки в `config/settings.js`:
```js
module.exports = {
  baseUrl: 'http://localhost:3000',
  outputDir: 'documentation_screenshots',
  viewport: { width: 1920, height: 1080 },
  mobileViewport: { width: 375, height: 667 },
  quality: 'high', // 'low', 'medium', 'high'
  headless: false,
  timeout: 10000,
  delay: 1000
};
```

### Сценарии в `config/scenarios.js`:
```js
module.exports = {
  states: [
    { name: '01_initial_page', action: 'navigateToMain', description: 'Начальная страница' },
    { name: '02_guest_mode', action: 'clickGuestLogin', description: 'Гостевой режим' },
    // ...
  ],
  components: [
    { name: '01_appbar', action: 'captureAppBar', description: 'Верхняя панель' },
    // ...
  ]
};
```

## 🔧 Создание новых сценариев

### 1. Добавить сценарий в `config/scenarios.js`:
```js
{
  name: 'new_screenshot',
  action: 'customAction',
  folder: 'custom',
  description: 'Описание скриншота'
}
```

### 2. Создать действие в `actions/interactions.js`:
```js
async function customAction(page, takeScreenshot) {
  // Логика действия
  await takeScreenshot('custom/new_screenshot', 'Описание');
}
```

### 3. Экспортировать действие:
```js
module.exports = {
  // ... другие действия
  customAction
};
```

## 📊 Отчеты

Модуль автоматически генерирует:

1. **screenshot_list.json** - список всех скриншотов с метаданными
2. **documentation.html** - HTML документация с галереей
3. **analysis_report.json** - детальный отчет анализа

### Пример отчета:
```json
{
  "timestamp": "2025-07-05T10:30:00.000Z",
  "totalScreenshots": 45,
  "categories": {
    "states": 8,
    "components": 12,
    "interactions": 15,
    "multiuser": 10
  },
  "quality": "high",
  "errors": [],
  "warnings": []
}
```

## 🎯 Для OCR бота

Модуль создает специальные скриншоты для обучения OCR бота:

### Элементы в папке `elements/`:
- **buttons/** - все кнопки с текстом
- **inputs/** - поля ввода с плейсхолдерами
- **menus/** - выпадающие меню
- **icons/** - иконки с подписями
- **text/** - текстовые блоки

### Метаданные для OCR:
```json
{
  "element": "button",
  "text": "Войти в систему",
  "selector": "button[data-testid='login-button']",
  "coordinates": { "x": 100, "y": 200, "width": 120, "height": 40 },
  "screenshot": "elements/buttons/login_button.png"
}
```

## 🚨 Обработка ошибок

Модуль автоматически:
- Создает скриншоты ошибок в папку `errors/`
- Логирует все проблемы в `logs/`
- Продолжает работу при частичных ошибках
- Генерирует отчет о проблемах

## 📝 Логирование

Все действия логируются в:
- `logs/execution.log` - общий лог выполнения
- `logs/errors.log` - ошибки
- `logs/screenshots.log` - детали создания скриншотов

## 🔄 Интеграция с другими модулями

### С OCR ботом:
```js
const screenshotModule = require('./screenshot-module');
const ocrBot = require('../ocr-bot');

// Создать скриншоты
await screenshotModule.run();

// Обучить OCR бота
await ocrBot.trainWithScreenshots('documentation_screenshots/elements/');
```

### С тестовой системой:
```js
const testRunner = require('../test-runner');

// Создать скриншоты перед тестами
await screenshotModule.run({ scenario: 'states' });

// Запустить тесты
await testRunner.run();
```

## 🎨 Кастомизация

### Изменение стилей HTML документации:
Редактируйте `reports/templates/documentation.html`

### Добавление новых типов скриншотов:
1. Создайте папку в `documentation_screenshots/`
2. Добавьте сценарии в `config/scenarios.js`
3. Создайте действия в `actions/`

### Изменение настроек браузера:
Редактируйте `config/settings.js`

---

## 📞 Поддержка

При проблемах:
1. Проверьте логи в `logs/`
2. Убедитесь, что сервер запущен на `http://localhost:3000`
3. Проверьте настройки в `config/settings.js`
4. Создайте issue с описанием проблемы 