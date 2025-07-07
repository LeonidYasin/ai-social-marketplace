# Деплой с существующим Blueprint + Syslog

## Обзор

Ваш существующий `render.yaml` файл обновлен для поддержки syslog сервера. Теперь при деплое на Render будет автоматически запускаться встроенный syslog сервер для приема логов.

## Что изменилось в render.yaml

### Добавлены переменные окружения для syslog:

```yaml
# Syslog Server Configuration
- key: ENABLE_SYSLOG
  value: true
- key: SYSLOG_PORT
  value: 514
- key: SYSLOG_HOST
  value: 0.0.0.0
- key: RENDER_SYSLOG_ENABLED
  value: true
- key: RENDER_SYSLOG_ENDPOINT
  value: localhost:514
```

### Добавлен диск для хранения логов:

```yaml
# Disk for logs storage
disk:
  name: logs-disk
  mountPath: /opt/render/project/src/backend/logs
  sizeGB: 1
```

## Пошаговый деплой

### 1. Подготовка репозитория

Убедитесь, что все изменения закоммичены:

```bash
git add .
git commit -m "Add syslog server integration to existing Blueprint"
git push origin main
```

### 2. Деплой через существующий Blueprint

1. Зайдите в [Render Dashboard](https://dashboard.render.com)
2. Найдите ваш существующий Blueprint
3. Нажмите "Update" или "Redeploy"
4. Render автоматически применит изменения из обновленного `render.yaml`

### 3. Альтернативный способ - через Git

Если у вас настроен автоматический деплой через Git:

1. Просто запушьте изменения в main ветку
2. Render автоматически обнаружит изменения в `render.yaml`
3. Запустится новый деплой с поддержкой syslog

## Настройка syslog в Render Dashboard

После успешного деплоя:

1. Зайдите в настройки вашего backend сервиса (`social-marketplace-api`)
2. Найдите раздел "Logs" или "Log Streaming"
3. Включите "Log Streaming"
4. Настройте параметры:
   - **Protocol**: UDP
   - **Host**: `social-marketplace-api.onrender.com` (ваш backend домен)
   - **Port**: 514

## Проверка работы syslog

После настройки проверьте API endpoints:

```bash
# Статус syslog сервера
curl https://social-marketplace-api.onrender.com/api/syslog/status

# Конфигурация
curl https://social-marketplace-api.onrender.com/api/syslog/config

# Все логи
curl https://social-marketplace-api.onrender.com/api/syslog/logs

# Только Render логи
curl https://social-marketplace-api.onrender.com/api/syslog/render-logs
```

## Мониторинг

### Автоматический мониторинг

Создайте скрипт для мониторинга:

```javascript
const axios = require('axios');

async function monitorSyslog() {
  try {
    const response = await axios.get('https://social-marketplace-api.onrender.com/api/syslog/status');
    const status = response.data.data;
    
    if (status.isRunning) {
      console.log(`✅ Syslog сервер работает на порту ${status.port}`);
    } else {
      console.log('❌ Syslog сервер остановлен');
    }
  } catch (error) {
    console.error('❌ Ошибка мониторинга:', error.message);
  }
}

// Проверять каждые 5 минут
setInterval(monitorSyslog, 5 * 60 * 1000);
```

### Использование готового скрипта

```bash
node syslog-monitor.js https://social-marketplace-api.onrender.com
```

## Структура логов

После настройки syslog логи будут сохраняться в:

- `logs/syslog.log` - все syslog сообщения
- `logs/render-logs.log` - только Render-специфичные логи
- `logs/backend.log` - обычные логи бэкенда
- `logs/frontend.log` - логи фронтенда

## Устранение неполадок

### Syslog сервер не запускается

1. Проверьте переменные окружения в Render Dashboard:
   ```
   ENABLE_SYSLOG=true
   SYSLOG_PORT=514
   ```

2. Проверьте логи деплоя в Render Dashboard

3. Проверьте API:
   ```bash
   curl https://social-marketplace-api.onrender.com/api/logs
   ```

### Логи не поступают

1. Убедитесь, что Log Streaming включен в Render Dashboard
2. Проверьте правильность хоста и порта (UDP, 514)
3. Проверьте, что backend сервис работает

### Проблемы с диском

1. Проверьте, что диск смонтирован:
   ```bash
   curl https://social-marketplace-api.onrender.com/api/syslog/status
   ```

2. В ответе должно быть:
   ```json
   {
     "logsDir": "/opt/render/project/src/backend/logs"
   }
   ```

## Преимущества интеграции

✅ **Автоматический деплой** - syslog интегрирован в существующий Blueprint
✅ **Бесплатный тариф** - работает на free плане Render
✅ **Постоянное хранение** - логи сохраняются на диске
✅ **Полный контроль** - API для управления и мониторинга
✅ **Без токенов** - не требует Render API токенов
✅ **Простая настройка** - только включить Log Streaming в Dashboard

## Следующие шаги

1. **Деплой** - запушьте изменения и дождитесь деплоя
2. **Настройка** - включите Log Streaming в Render Dashboard
3. **Тестирование** - проверьте API endpoints
4. **Мониторинг** - настройте автоматический мониторинг
5. **Алерты** - добавьте уведомления о проблемах

## Полезные команды

```bash
# Проверка статуса
curl https://social-marketplace-api.onrender.com/api/syslog/status

# Получение последних логов
curl https://social-marketplace-api.onrender.com/api/syslog/logs?limit=50

# Мониторинг в реальном времени
node syslog-monitor.js https://social-marketplace-api.onrender.com

# Тестирование syslog
node test-syslog-deployment.js https://social-marketplace-api.onrender.com
```

Теперь ваш существующий Blueprint будет автоматически деплоить приложение с встроенным syslog сервером! 