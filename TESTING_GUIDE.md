# Руководство по тестированию системы

## Обзор системы тестирования

Система включает в себя комплексное тестирование многопользовательского режима с визуальным тестированием интерфейса.

### Типы тестов

1. **Многопользовательское тестирование** - проверка регистрации, входа, профилей, постов, комментариев, реакций и сообщений
2. **Тестирование производительности** - нагрузочное тестирование API
3. **Тестирование безопасности** - проверка уязвимостей и защиты
4. **Визуальное тестирование** - автоматизированное тестирование UI с распознаванием скриншотов
5. **Мониторинг системы** - отслеживание состояния сервисов

## Быстрый старт

### Предварительные требования

1. **Node.js** версии 16 или выше
2. **PostgreSQL** база данных
3. **Chrome/Chromium** для визуального тестирования
4. **Tesseract.js** для OCR анализа

### Установка зависимостей

```bash
# Установка основных зависимостей
npm install

# Установка зависимостей для backend
cd backend && npm install

# Установка зависимостей для frontend
cd frontend && npm install

# Установка дополнительных зависимостей для тестирования
npm install puppeteer tesseract.js node-fetch@2
```

### Настройка базы данных

```bash
# Создание таблиц
node setup_database.js

# Или выполнение SQL скрипта
psql -d your_database -f setup_database.sql
```

## Запуск тестов

### Запуск всех тестов

```bash
npm test
# или
npm run test:all
```

### Запуск отдельных типов тестов

```bash
# Многопользовательское тестирование
npm run test:multiuser

# Тестирование производительности
npm run test:performance

# Тестирование безопасности
npm run test:security

# Визуальное тестирование
npm run test:visual

# Мониторинг системы
npm run monitor
```

### Запуск через PowerShell (Windows)

```powershell
# Запуск всех тестов
node run_all_tests.js

# Запуск конкретного теста
node run_all_tests.js multiuser
node run_all_tests.js performance
node run_all_tests.js security
node run_all_tests.js ui
```

## Визуальное тестирование

### Особенности

- **Автоматизированное тестирование UI** с помощью Puppeteer
- **OCR анализ скриншотов** с помощью Tesseract.js
- **Многопользовательское тестирование** в разных браузерах
- **Проверка отображения пользователей** в правой панели
- **Анализ API вызовов** и localStorage

### Конфигурация

Файл `test_visual_integrated.js` содержит настройки:

```javascript
const CONFIG = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:8000/api',
  screenshotsDir: './test_screenshots',
  logsDir: './test_logs',
  testUsers: [
    { email: 'visual_test_user1@example.com', password: 'password123', name: 'Визуальный Тест 1' },
    { email: 'visual_test_user2@example.com', password: 'password123', name: 'Визуальный Тест 2' },
    { email: 'visual_test_user3@example.com', password: 'password123', name: 'Визуальный Тест 3' }
  ]
};
```

### Что тестируется

1. **Регистрация пользователей** - автоматическая регистрация тестовых пользователей
2. **Отображение пользователей** - проверка списка пользователей в правой панели
3. **Скриншоты** - создание скриншотов для каждого пользователя
4. **OCR анализ** - распознавание текста на скриншотах
5. **API вызовы** - мониторинг сетевых запросов
6. **localStorage** - проверка сохранения данных пользователя

### Результаты

Результаты сохраняются в:
- `test_logs/visual_test.log` - основные логи тестирования
- `test_logs/ocr_analysis.log` - результаты OCR анализа
- `test_logs/api_calls.log` - логи API вызовов
- `test_logs/errors.log` - ошибки
- `test_screenshots/` - скриншоты для анализа

## Структура логов

### Основные файлы логов

```
test_logs/
├── visual_test.log          # Логи визуального тестирования
├── ocr_analysis.log         # Результаты OCR анализа
├── api_calls.log           # Логи API вызовов
├── errors.log              # Ошибки
├── multiuser_test.log      # Логи многопользовательского тестирования
├── performance_test.log    # Логи тестирования производительности
├── security_test.log       # Логи тестирования безопасности
└── system_monitor.log      # Логи мониторинга системы
```

### Скриншоты

```
test_screenshots/
├── visual_test_user1_*.png  # Скриншоты первого пользователя
├── visual_test_user2_*.png  # Скриншоты второго пользователя
├── visual_test_user3_*.png  # Скриншоты третьего пользователя
└── ...                      # Другие скриншоты
```

## Интерпретация результатов

### Успешные тесты

- ✅ Все пользователи зарегистрированы
- ✅ Пользователи отображаются в правой панели
- ✅ API вызовы выполняются корректно
- ✅ localStorage содержит данные пользователя
- ✅ OCR анализ распознает элементы интерфейса

### Возможные проблемы

- ❌ Ошибки регистрации пользователей
- ❌ Пользователи не отображаются в панели
- ❌ API возвращает ошибки 404/500
- ❌ localStorage пустой
- ❌ OCR не распознает элементы

### Рекомендации по исправлению

1. **Проверьте запущены ли сервисы:**
   ```bash
   # Backend на порту 8000
   curl http://localhost:8000/api/health
   
   # Frontend на порту 3000
   curl http://localhost:3000
   ```

2. **Проверьте базу данных:**
   ```bash
   node test_db.js
   ```

3. **Проверьте логи backend:**
   ```bash
   cd backend && npm start
   ```

4. **Проверьте Chrome/Chromium:**
   ```bash
   # Установите Chrome если не установлен
   # Или используйте Chromium
   ```

## Расширенное использование

### Добавление новых тестов

1. Создайте новый файл теста (например, `test_custom.js`)
2. Экспортируйте функцию тестирования
3. Добавьте в `run_all_tests.js`
4. Добавьте npm скрипт в `package.json`

### Настройка OCR

Для улучшения распознавания текста:

```javascript
const result = await Tesseract.recognize(
  filePath,
  'rus+eng', // Русский и английский языки
  {
    logger: m => console.log(m.status),
    // Дополнительные настройки
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'
  }
);
```

### Настройка Puppeteer

Для изменения поведения браузера:

```javascript
const browser = await puppeteer.launch({ 
  headless: false,        // Показывать браузер
  slowMo: 500,           // Замедление действий
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=1920,1080'
  ]
});
```

## Устранение неполадок

### Частые проблемы

1. **Chrome не найден:**
   ```bash
   npm install puppeteer
   # Или установите Chrome вручную
   ```

2. **Tesseract не работает:**
   ```bash
   npm install tesseract.js
   ```

3. **API недоступен:**
   ```bash
   cd backend && npm start
   ```

4. **Frontend недоступен:**
   ```bash
   cd frontend && npm start
   ```

5. **Ошибки базы данных:**
   ```bash
   # Проверьте подключение к БД
   node test_db.js
   
   # Пересоздайте таблицы
   node setup_database.js
   ```

### Отладка

Для отладки тестов используйте:

```bash
# Подробные логи
DEBUG=* node test_visual_integrated.js

# Только ошибки
node test_visual_integrated.js 2> errors.log

# Сохранение всех логов
node test_visual_integrated.js > full.log 2>&1
```

## Интеграция с CI/CD

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

### Docker

```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y \
    chromium-browser \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY . .
RUN npm install
CMD ["npm", "test"]
```

## Заключение

Система визуального тестирования обеспечивает:

- **Автоматизированную проверку UI** без ручного вмешательства
- **OCR анализ** для проверки отображения текста
- **Многопользовательское тестирование** в реальных условиях
- **Детальное логирование** для отладки
- **Интеграцию** с общей системой тестирования

Регулярное выполнение тестов поможет обеспечить стабильность и качество приложения. 