# Проверка деплоя на Render

## 🚀 Изменения запушены

Коммит: `867237b` - "Fix syslog port configuration for Render deployment"

## 📋 Что нужно проверить на Render

### 1. Backend Service (social-marketplace-api)
- ✅ **Порт**: должен быть 10000 (автоматически устанавливается Render)
- ✅ **Syslog сервер**: должен запуститься на том же порту 10000
- ✅ **Health endpoint**: `https://social-marketplace-api.onrender.com/api/health`

### 2. Frontend Service (social-marketplace-frontend)
- ✅ **Подключение к backend**: должно работать автоматически
- ✅ **WebSocket**: должен подключаться к backend

### 3. Syslog функциональность
- ✅ **UDP syslog**: должен принимать сообщения на порту 10000
- ✅ **API endpoint**: `https://social-marketplace-api.onrender.com/api/syslog/logs`

## 🔍 Команды для проверки

### Проверка backend
```bash
curl https://social-marketplace-api.onrender.com/api/health
```

### Проверка syslog
```bash
curl https://social-marketplace-api.onrender.com/api/syslog/logs
```

### Тест syslog сообщения
```bash
echo '<134>Jul 7 23:30:00 render-test render: Test deployment' | nc -u social-marketplace-api.onrender.com 10000
```

## 📊 Ожидаемые результаты

### Health endpoint
```json
{
  "status": "ok",
  "message": "Backend API is running!",
  "timestamp": "2025-07-07T23:30:40.260Z",
  "environment": "production",
  "version": "2.0.0"
}
```

### Syslog endpoint
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 0
  }
}
```

## 🐛 Возможные проблемы

1. **Порт 10000 недоступен** - проверить настройки Render
2. **Syslog не запускается** - проверить переменную ENABLE_SYSLOG
3. **Frontend не подключается** - проверить переменные REACT_APP_API_URL

## 📝 Логи для проверки

В Render Dashboard:
- Backend logs
- Build logs
- Environment variables

## ✅ Критерии успеха

- [ ] Backend отвечает на health endpoint
- [ ] Syslog API возвращает данные
- [ ] Frontend загружается без ошибок
- [ ] WebSocket подключения работают
- [ ] Syslog сервер принимает сообщения 