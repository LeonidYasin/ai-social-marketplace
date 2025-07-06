# 🎯 Ультра-простая версия render.yaml

## ✅ Что сделано:

- ✅ Убраны ВСЕ проблемные параметры
- ✅ Оставлены только самые базовые настройки
- ✅ Добавлен `startCommand` для PostgreSQL
- ✅ Минимальная конфигурация

## 🚀 Попробуйте развёртывание:

1. **Перейдите в [Render Dashboard](https://dashboard.render.com/)**
2. **Нажмите "New +" → "Blueprint"**
3. **Подключите ваш GitHub репозиторий**
4. **Нажмите "Create Blueprint Instance"**

## 📋 Что будет создано:

- ✅ **PostgreSQL Database** (`social-marketplace-db`)
- ✅ **Backend API** (`social-marketplace-backend`)
- ✅ **Frontend** (`social-marketplace-frontend`)

## ⚙️ Настройка после развёртывания:

### 1. Переменные окружения для Backend:

**Добавьте ВСЕ переменные вручную:**

```
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
DB_HOST=ваш-host-из-postgresql
DB_PORT=ваш-port-из-postgresql
DB_NAME=ваш-database-из-postgresql
DB_USER=ваш-user-из-postgresql
DB_PASSWORD=ваш-password-из-postgresql
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
SESSION_SECRET=ваш-секретный-ключ-минимум-32-символа
GOOGLE_CLIENT_ID=ваш-google-client-id
GOOGLE_CLIENT_SECRET=ваш-google-client-secret
GOOGLE_CALLBACK_URL=https://ваш-backend-url.onrender.com/api/auth/google/callback
TELEGRAM_BOT_TOKEN=ваш-telegram-bot-token
```

### 2. Переменные окружения для Frontend:

```
REACT_APP_API_URL=https://ваш-backend-url.onrender.com
REACT_APP_WS_URL=https://ваш-backend-url.onrender.com
```

### 3. Инициализация базы данных:

1. В Backend сервисе → **Logs** → **Shell**
2. Выполните: `npm run init-db`

## 🔑 Генерация секретных ключей:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Проверка работоспособности:

1. **Backend**: `https://ваш-backend-url.onrender.com/api/health`
2. **Frontend**: `https://ваш-frontend-url.onrender.com`

## 🆘 Если ВСЁ ЕЩЁ ошибка:

Если даже эта версия не работает, используйте ручное развёртывание:

1. **Удалите render.yaml:**
   ```bash
   mv render.yaml render.yaml.disabled
   git add . && git commit -m "Disable render.yaml" && git push origin main
   ```

2. **Следуйте ручному руководству:**
   - `MANUAL_DEPLOYMENT.md`

## 🎯 Почему эта версия должна работать:

- ✅ Только базовые параметры
- ✅ Нет сложных зависимостей
- ✅ Правильный `startCommand` для PostgreSQL
- ✅ Минимальная конфигурация

---

**🎉 Эта версия максимально простая и должна работать!** 