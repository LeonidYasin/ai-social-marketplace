# 🛠️ Ручное развёртывание на Render.com (без render.yaml)

## 🚀 Пошаговое руководство

### Шаг 1: Создание проекта

1. Войдите в [Render Dashboard](https://dashboard.render.com/)
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите ваш GitHub репозиторий
4. Заполните форму:
   - **Name**: `social-marketplace`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
5. Нажмите **"Create Web Service"**

### Шаг 2: Добавление PostgreSQL Database

1. В созданном проекте нажмите **"New +"** → **"PostgreSQL"**
2. Заполните форму:
   - **Name**: `social-marketplace-db`
   - **Database**: `social_marketplace`
   - **User**: `postgres` (по умолчанию)
   - **Plan**: Free
3. Нажмите **"Create Database"**
4. Запишите данные подключения:
   - **Host**
   - **Port**
   - **Database**
   - **User**
   - **Password**

### Шаг 3: Добавление Frontend

1. В том же проекте нажмите **"New +"** → **"Static Site"**
2. Подключите тот же GitHub репозиторий
3. Заполните форму:
   - **Name**: `social-marketplace-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: Free
4. Нажмите **"Create Static Site"**

### Шаг 4: Настройка переменных окружения

#### В Backend сервисе добавьте:

**Основные настройки:**
```
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
```

**База данных (используйте данные из шага 2):**
```
DB_HOST=ваш-host-из-postgresql
DB_PORT=ваш-port-из-postgresql
DB_NAME=ваш-database-из-postgresql
DB_USER=ваш-user-из-postgresql
DB_PASSWORD=ваш-password-из-postgresql
```

**Секретные ключи:**
```
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
SESSION_SECRET=ваш-секретный-ключ-минимум-32-символа
```

**OAuth настройки:**
```
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

### Шаг 5: Инициализация базы данных

1. Перейдите в Backend сервис
2. В разделе **"Logs"** найдите кнопку **"Shell"**
3. Выполните команду:
   ```bash
   npm run init-db
   ```

### Шаг 6: Проверка работоспособности

1. **Backend**: `https://ваш-backend-url.onrender.com/api/health`
2. **Frontend**: `https://ваш-frontend-url.onrender.com`

## 🔧 Генерация секретных ключей

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

## 🆘 Устранение неполадок

### Проблемы с базой данных:
- Проверьте, что все переменные БД правильно скопированы
- Убедитесь, что SSL настроен (автоматически в Render)
- Проверьте логи backend на ошибки подключения

### Проблемы с CORS:
- Backend автоматически настроен для доменов Render
- Проверьте переменные REACT_APP_API_URL и REACT_APP_WS_URL

### Проблемы с OAuth:
- Проверьте callback URL в Google Console
- Убедитесь, что переменные Google настроены

## 📋 Чек-лист

- [ ] Создан Web Service для backend
- [ ] Создан PostgreSQL Database
- [ ] Создан Static Site для frontend
- [ ] Настроены переменные окружения backend
- [ ] Настроены переменные окружения frontend
- [ ] Инициализирована база данных
- [ ] Проверена работоспособность backend
- [ ] Проверена работоспособность frontend

## 📞 Поддержка

- **Логи**: Render Dashboard → ваш проект → сервис → Logs
- **Документация**: `DEPLOYMENT_GUIDE.md`
- **Render Docs**: https://render.com/docs

---

**Удачного развёртывания! 🎉** 