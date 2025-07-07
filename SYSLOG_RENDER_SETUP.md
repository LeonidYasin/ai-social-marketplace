# Syslog Server Setup for Render Deployment

## Обзор

Этот проект теперь включает встроенный syslog сервер, который позволяет получать логи напрямую от Render без необходимости API токенов. Это особенно полезно для бесплатного тарифного плана Render.

## Архитектура

### Компоненты

1. **SyslogServer** (`backend/src/utils/syslogServer.js`)
   - UDP сервер на порту 514 (стандартный syslog порт)
   - Парсинг RFC 3164 syslog сообщений
   - Фильтрация Render-специфичных логов
   - Сохранение в отдельные файлы

2. **API маршруты** (`backend/src/routes/syslog.js`)
   - `/api/syslog/status` - статус сервера
   - `/api/syslog/logs` - получение всех логов
   - `/api/syslog/render-logs` - получение Render логов
   - `/api/syslog/start` - запуск сервера
   - `/api/syslog/stop` - остановка сервера
   - `/api/syslog/restart` - перезапуск сервера
   - `/api/syslog/config` - конфигурация

3. **Blueprint файл** (`render-blueprint.yaml`)
   - Автоматический деплой на Render
   - Настройка переменных окружения
   - Монтирование диска для логов

## Переменные окружения

```env
# Syslog Server Configuration
ENABLE_SYSLOG=true
SYSLOG_PORT=514
SYSLOG_HOST=0.0.0.0
RENDER_SYSLOG_ENABLED=true
RENDER_SYSLOG_ENDPOINT=localhost:514
```

## Настройка на Render

### 1. Автоматический деплой через Blueprint

1. Зайдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите "New" → "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Выберите файл `render-blueprint.yaml`
5. Нажмите "Apply"

### 2. Ручная настройка

Если вы предпочитаете ручную настройку:

1. Создайте новый Web Service
2. Подключите ваш репозиторий
3. Установите переменные окружения:
   ```
   ENABLE_SYSLOG=true
   SYSLOG_PORT=514
   SYSLOG_HOST=0.0.0.0
   RENDER_SYSLOG_ENABLED=true
   RENDER_SYSLOG_ENDPOINT=localhost:514
   ```

### 3. Настройка syslog в Render

После деплоя:

1. Зайдите в настройки вашего сервиса
2. Найдите раздел "Logs"
3. Включите "Log Streaming"
4. Установите:
   - **Protocol**: UDP
   - **Host**: ваш-домен.onrender.com
   - **Port**: 514

## Тестирование

### Локальное тестирование

1. Запустите бэкенд:
   ```bash
   cd backend
   npm install
   ENABLE_SYSLOG=true npm start
   ```

2. В другом терминале запустите тест:
   ```bash
   node test-syslog.js
   ```

3. Проверьте API:
   ```bash
   curl http://localhost:8000/api/syslog/status
   curl http://localhost:8000/api/syslog/logs
   curl http://localhost:8000/api/syslog/render-logs
   ```

### Тестирование на Render

После деплоя:

```bash
curl https://your-app.onrender.com/api/syslog/status
curl https://your-app.onrender.com/api/syslog/logs
curl https://your-app.onrender.com/api/syslog/render-logs
```

## Структура логов

### Файлы логов

- `logs/syslog.log` - все syslog сообщения
- `logs/render-logs.log` - только Render-специфичные логи

### Формат логов

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "remoteAddress": "127.0.0.1",
  "remotePort": 12345,
  "originalMessage": "<13>Jan 15 10:30:00 render-host render: Application started",
  "parsed": {
    "priority": 13,
    "facility": 1,
    "severity": 5,
    "timestamp": "Jan 15 10:30:00",
    "host": "render-host",
    "tag": "render",
    "message": "Application started"
  }
}
```

## API Endpoints

### GET /api/syslog/status
Получить статус syslog сервера

**Ответ:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "port": 514,
    "logsDir": "/path/to/logs",
    "syslogFile": "/path/to/logs/syslog.log",
    "renderLogsFile": "/path/to/logs/render-logs.log"
  }
}
```

### GET /api/syslog/logs?limit=100
Получить последние логи

**Параметры:**
- `limit` (опционально) - количество записей (по умолчанию 100)

### GET /api/syslog/render-logs?limit=100
Получить только Render логи

### POST /api/syslog/start
Запустить syslog сервер (требует админ права)

### POST /api/syslog/stop
Остановить syslog сервер (требует админ права)

### POST /api/syslog/restart
Перезапустить syslog сервер (требует админ права)

### GET /api/syslog/config
Получить конфигурацию

## Мониторинг

### Проверка статуса

```bash
# Проверка статуса сервера
curl https://your-app.onrender.com/api/syslog/status

# Проверка конфигурации
curl https://your-app.onrender.com/api/syslog/config

# Получение последних логов
curl https://your-app.onrender.com/api/syslog/logs?limit=50
```

### Автоматический мониторинг

Создайте скрипт для периодической проверки:

```javascript
const axios = require('axios');

async function checkSyslogHealth() {
  try {
    const response = await axios.get('https://your-app.onrender.com/api/syslog/status');
    console.log('Syslog server status:', response.data);
    
    if (!response.data.data.isRunning) {
      console.error('Syslog server is not running!');
    }
  } catch (error) {
    console.error('Failed to check syslog status:', error.message);
  }
}

// Проверять каждые 5 минут
setInterval(checkSyslogHealth, 5 * 60 * 1000);
```

## Устранение неполадок

### Сервер не запускается

1. Проверьте переменные окружения:
   ```bash
   echo $ENABLE_SYSLOG
   echo $SYSLOG_PORT
   ```

2. Проверьте логи:
   ```bash
   curl https://your-app.onrender.com/api/logs
   ```

3. Проверьте права доступа к порту 514 (может потребоваться sudo)

### Логи не поступают

1. Проверьте настройки syslog в Render Dashboard
2. Убедитесь, что протокол установлен как UDP
3. Проверьте правильность хоста и порта

### Проблемы с производительностью

1. Ограничьте количество сохраняемых логов:
   ```javascript
   const logs = syslogServer.getRecentLogs(100); // только 100 записей
   ```

2. Настройте ротацию логов в production

## Безопасность

### Рекомендации

1. **Ограничьте доступ к API** - используйте middleware для проверки прав доступа
2. **Мониторинг** - следите за размером лог файлов
3. **Ротация логов** - настройте автоматическую очистку старых логов
4. **Шифрование** - рассмотрите использование TLS для syslog в production

### Настройка аутентификации

Добавьте middleware для защиты API endpoints:

```javascript
// В routes/syslog.js
const checkAdmin = require('../middleware/checkAdmin');

router.post('/start', checkAdmin, (req, res) => {
  // ... код
});
```

## Заключение

Встроенный syslog сервер обеспечивает:

- ✅ Автоматический прием логов от Render
- ✅ Не требует API токенов
- ✅ Работает на бесплатном тарифе
- ✅ Простая интеграция через Blueprint
- ✅ Полный контроль над логами
- ✅ API для управления и мониторинга

Это решение идеально подходит для автоматического деплоя на Render в рамках бесплатного тарифного плана. 