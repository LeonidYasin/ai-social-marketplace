# ⚡ Быстрое развёртывание на Render.com

## 🚀 5 минут до запуска

### 1. Подготовка (1 минута)
```bash
# Проверьте готовность проекта
node check-deployment-readiness.js

# Убедитесь, что код закоммичен
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Создание сервисов в Render (3 минуты)

#### База данных PostgreSQL:
- **New +** → **PostgreSQL**
- **Name**: `social-marketplace-db`
- **Plan**: Free
- **Create Database**

#### Backend API:
- **New +** → **Web Service**
- **Connect Repository** → выберите ваш репозиторий
- **Name**: `social-marketplace-backend`
- **Environment**: Node
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Plan**: Free
- **Create Web Service**

#### Frontend:
- **New +** → **Static Site**
- **Connect Repository** → выберите ваш репозиторий
- **Name**: `social-marketplace-frontend`
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/build`
- **Plan**: Free
- **Create Static Site**

### 3. Настройка переменных окружения (1 минута)

#### В Backend сервисе добавьте:
```
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
SESSION_SECRET=ваш-секретный-ключ-минимум-32-символа
GOOGLE_CLIENT_ID=ваш-google-client-id
GOOGLE_CLIENT_SECRET=ваш-google-client-secret
GOOGLE_CALLBACK_URL=https://ваш-backend-url.onrender.com/api/auth/google/callback
TELEGRAM_BOT_TOKEN=ваш-telegram-bot-token
```

#### В Frontend сервисе добавьте:
```
REACT_APP_API_URL=https://ваш-backend-url.onrender.com
REACT_APP_WS_URL=https://ваш-backend-url.onrender.com
```

### 4. Инициализация базы данных
- В Backend сервисе → **Logs** → **Shell**
- Выполните: `npm run init-db`

## ✅ Проверка работоспособности

1. **Backend**: `https://ваш-backend-url.onrender.com/api/health`
2. **Frontend**: `https://ваш-frontend-url.onrender.com`

## 🆘 Если что-то не работает

### Проблемы с CORS:
- Проверьте, что в backend настроены домены Render
- Убедитесь, что переменные окружения frontend правильные

### Проблемы с базой данных:
- Проверьте SSL настройки
- Убедитесь, что переменные БД настроены

### Проблемы с OAuth:
- Проверьте callback URL в Google Console
- Убедитесь, что переменные Google настроены

## 📞 Поддержка

- **Логи**: Render Dashboard → ваш сервис → Logs
- **Документация**: `DEPLOYMENT_GUIDE.md`
- **Render Docs**: https://render.com/docs

---

**Удачного развёртывания! 🎉** 