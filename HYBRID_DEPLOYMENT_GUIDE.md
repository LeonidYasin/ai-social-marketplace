# 🔄 Гибридное развёртывание на Render.com

## 🎯 Решение проблемы с PostgreSQL

Поскольку Render.com имеет проблемы с PostgreSQL в `render.yaml`, мы используем **гибридный подход**:

### ✅ Автоматическое развёртывание:
- Backend API
- Frontend

### ⚙️ Ручное создание:
- PostgreSQL Database

## 🚀 Пошаговое развёртывание

### Шаг 1: Автоматическое развёртывание сервисов

1. **Перейдите в [Render Dashboard](https://dashboard.render.com/)**
2. **Нажмите "New +" → "Blueprint"**
3. **Подключите ваш GitHub репозиторий**
4. **Нажмите "Create Blueprint Instance"**

Это создаст:
- ✅ **Backend API** (`social-marketplace-backend`)
- ✅ **Frontend** (`social-marketplace-frontend`)

### Шаг 2: Создание PostgreSQL Database

1. **В том же проекте нажмите "New +" → "PostgreSQL"**
2. **Заполните форму:**
   - **Name**: `social-marketplace-db`
   - **Database**: `social_marketplace`
   - **User**: `postgres` (по умолчанию)
   - **Plan**: Free
3. **Нажмите "Create Database"**
4. **Запишите данные подключения:**
   - Host
   - Port
   - Database
   - User
   - Password

### Шаг 3: Настройка переменных окружения

#### В Backend сервисе добавьте:

**База данных (используйте данные из шага 2):**
```
DB_HOST=ваш-host-из-postgresql
DB_PORT=ваш-port-из-postgresql
DB_NAME=ваш-database-из-postgresql
DB_USER=ваш-user-из-postgresql
DB_PASSWORD=ваш-password-из-postgresql
```

**Основные настройки:**
```
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
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

### Шаг 4: Инициализация базы данных

1. В **Backend сервисе** → **Logs** → **Shell**
2. Выполните: `npm run init-db`

## 🔑 Генерация секретных ключей

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ✅ Проверка работоспособности

1. **Backend**: `https://ваш-backend-url.onrender.com/api/health`
2. **Frontend**: `https://ваш-frontend-url.onrender.com`

## 🎯 Преимущества этого подхода

- ✅ Избегаем проблем с PostgreSQL в render.yaml
- ✅ Автоматическое развёртывание backend и frontend
- ✅ Полный контроль над настройкой базы данных
- ✅ Надёжное решение

## 📋 Чек-лист

- [ ] Blueprint создан успешно
- [ ] Backend и Frontend созданы
- [ ] PostgreSQL Database создан отдельно
- [ ] Переменные окружения backend настроены
- [ ] Переменные окружения frontend настроены
- [ ] База данных инициализирована
- [ ] Backend отвечает на /api/health
- [ ] Frontend загружается

## 📞 Поддержка

- **Логи**: Render Dashboard → сервис → Logs
- **Ручное развёртывание**: `MANUAL_DEPLOYMENT.md`
- **Настройка после развёртывания**: `POST_DEPLOYMENT_SETUP.md`

---

**🎉 Этот подход должен работать без ошибок!** 