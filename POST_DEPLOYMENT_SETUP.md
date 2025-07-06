# ⚙️ Настройка после автоматического развёртывания

## 🎉 Автоматическое развёртывание завершено!

Ваш проект успешно развёрнут на Render.com с помощью `render-auto.yaml`. Теперь нужно настроить несколько вещей:

## 📋 Что уже настроено автоматически:

✅ **PostgreSQL Database** - создана и настроена
✅ **Backend API** - создан с автоматической настройкой БД
✅ **Frontend** - создан, но требует настройки переменных

## 🔧 Что нужно настроить вручную:

### 1. Переменные окружения для Backend

В **Backend сервисе** добавьте недостающие переменные:

```
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
SESSION_SECRET=ваш-секретный-ключ-минимум-32-символа
GOOGLE_CLIENT_ID=ваш-google-client-id
GOOGLE_CLIENT_SECRET=ваш-google-client-secret
GOOGLE_CALLBACK_URL=https://ваш-backend-url.onrender.com/api/auth/google/callback
TELEGRAM_BOT_TOKEN=ваш-telegram-bot-token
```

### 2. Переменные окружения для Frontend

В **Frontend сервисе** добавьте:

```
REACT_APP_API_URL=https://ваш-backend-url.onrender.com
REACT_APP_WS_URL=https://ваш-backend-url.onrender.com
```

### 3. Инициализация базы данных

1. Перейдите в **Backend сервис**
2. В разделе **"Logs"** найдите кнопку **"Shell"**
3. Выполните команду:
   ```bash
   npm run init-db
   ```

## 🔑 Генерация секретных ключей

### JWT_SECRET и SESSION_SECRET:
```bash
# В терминале выполните:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Примеры секретных ключей:
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234
SESSION_SECRET=fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321
```

## ✅ Проверка работоспособности

1. **Backend**: `https://ваш-backend-url.onrender.com/api/health`
   - Должен вернуть: `{"status":"ok","message":"Backend API is running!"}`

2. **Frontend**: `https://ваш-frontend-url.onrender.com`
   - Должна загрузиться главная страница

## 🆘 Если что-то не работает

### Проблемы с базой данных:
- Проверьте, что все переменные БД настроены автоматически
- Убедитесь, что база данных инициализирована

### Проблемы с CORS:
- Backend автоматически настроен для доменов Render
- Проверьте переменные REACT_APP_API_URL и REACT_APP_WS_URL

### Проблемы с OAuth:
- Проверьте callback URL в Google Console
- Убедитесь, что переменные Google настроены

## 📞 Поддержка

- **Логи**: Render Dashboard → ваш проект → сервис → Logs
- **Документация**: `DEPLOYMENT_GUIDE.md`
- **Ручное развёртывание**: `MANUAL_DEPLOYMENT.md`

---

**🎉 Поздравляем! Ваш проект развёрнут автоматически!** 