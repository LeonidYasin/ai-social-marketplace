
# Инструкции по деплою на Render

## 1. Подготовка репозитория

Убедитесь, что все изменения закоммичены:

```bash
git add .
git commit -m "Add syslog server for Render deployment"
git push origin main
```

## 2. Деплой через Blueprint (рекомендуется)

1. Зайдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите "New" → "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Выберите файл `render-blueprint.yaml`
5. Нажмите "Apply"

## 3. Ручная настройка

Если Blueprint не работает:

1. Создайте новый Web Service
2. Подключите ваш репозиторий
3. Установите переменные окружения:

```env
NODE_ENV=production
ENABLE_SYSLOG=true
SYSLOG_PORT=514
SYSLOG_HOST=0.0.0.0
RENDER_SYSLOG_ENABLED=true
RENDER_SYSLOG_ENDPOINT=localhost:514
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

4. Build Command: `cd backend && npm install`
5. Start Command: `cd backend && npm start`

## 4. Настройка syslog в Render

После деплоя:

1. Зайдите в настройки сервиса
2. Найдите раздел "Logs"
3. Включите "Log Streaming"
4. Установите:
   - Protocol: UDP
   - Host: ваш-домен.onrender.com
   - Port: 514

## 5. Тестирование

После деплоя проверьте:

```bash
# Статус syslog сервера
curl https://your-app.onrender.com/api/syslog/status

# Конфигурация
curl https://your-app.onrender.com/api/syslog/config

# Логи
curl https://your-app.onrender.com/api/syslog/logs

# Render логи
curl https://your-app.onrender.com/api/syslog/render-logs
```

## 6. Мониторинг

Создайте скрипт для мониторинга:

```javascript
const axios = require('axios');

async function monitorSyslog() {
  try {
    const response = await axios.get('https://your-app.onrender.com/api/syslog/status');
    console.log('Syslog status:', response.data.data.isRunning ? '✅ Running' : '❌ Stopped');
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
}

// Проверять каждые 5 минут
setInterval(monitorSyslog, 5 * 60 * 1000);
```

## 7. Устранение неполадок

### Сервер не запускается
- Проверьте переменные окружения
- Проверьте логи: `curl https://your-app.onrender.com/api/logs`

### Логи не поступают
- Проверьте настройки syslog в Render Dashboard
- Убедитесь, что протокол UDP
- Проверьте правильность хоста и порта

### Проблемы с производительностью
- Ограничьте количество логов в API
- Настройте ротацию логов

## 8. Безопасность

- Ограничьте доступ к API endpoints
- Мониторьте размер лог файлов
- Настройте ротацию логов
- Рассмотрите использование TLS в production

## 9. Преимущества

✅ Автоматический прием логов от Render
✅ Не требует API токенов
✅ Работает на бесплатном тарифе
✅ Полный контроль над логами
✅ API для управления и мониторинга
✅ Простая интеграция через Blueprint

## 10. Следующие шаги

1. Настройте автоматические алерты
2. Добавьте мониторинг производительности
3. Настройте ротацию логов
4. Добавьте аутентификацию для API
5. Настройте резервное копирование логов
