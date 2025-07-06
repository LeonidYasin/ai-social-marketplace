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

### 2. Создание проекта в Render (3 минуты)

#### Вариант A: Автоматическое развёртывание (рекомендуется)
1. Войдите в [Render Dashboard](https://dashboard.render.com/)
2. Нажмите **"New +"** → **"Blueprint"**
3. Подключите ваш GitHub репозиторий
4. Render автоматически создаст один проект с тремя сервисами:
   - **PostgreSQL Database** (`social-marketplace-db`)
   - **Web Service** (`social-marketplace-backend`)
   - **Static Site** (`social-marketplace-frontend`)
5. Нажмите **"Create Blueprint Instance"**

#### Вариант B: Ручное создание
1. **Создайте проект:**
   - **New +** → **"Blueprint"** или **"Web Service"**
   - Подключите ваш GitHub репозиторий
   - **Name**: `social-marketplace`
   - **Plan**: Free

2. **В рамках этого проекта создайте сервисы:**
   - **New +** → **PostgreSQL** (в том же проекте)
   - **New +** → **Web Service** (в том же проекте)
   - **New +** → **Static Site** (в том же проекте)

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

### Проблемы с render.yaml:
Если получаете ошибку "A render.yaml file was found, but there was an issue":

1. **Используйте упрощённую версию:**
   - Переименуйте `render.yaml` в `render.yaml.backup`
   - Переименуйте `render-simple.yaml` в `render.yaml`
   - Закоммитьте изменения и попробуйте снова

2. **Или создайте сервисы вручную:**
   - Следуйте варианту B выше
   - Настройте переменные окружения вручную

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

- **Логи**: Render Dashboard → ваш проект → сервис → Logs
- **Документация**: `DEPLOYMENT_GUIDE.md`
- **Render Docs**: https://render.com/docs

---

**Удачного развёртывания! 🎉** 