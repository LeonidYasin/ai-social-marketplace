# 🚀 Руководство по развёртыванию на Render.com

## 📋 Обзор

Этот проект представляет собой полнофункциональную социальную платформу с React frontend и Node.js backend, использующую PostgreSQL базу данных. Для развёртывания на Render.com мы создадим один проект с тремя сервисами:

1. **PostgreSQL Database** - база данных
2. **Backend API** - Node.js сервер
3. **Frontend** - React приложение

## 🛠️ Подготовка к развёртыванию

### 1. Настройка переменных окружения

Перед развёртыванием необходимо настроить следующие переменные окружения в Render:

#### Для Backend сервиса:
- `NODE_ENV` = `production`
- `PORT` = `8000`
- `HOST` = `0.0.0.0`
- `JWT_SECRET` = `ваш-секретный-ключ-jwt`
- `SESSION_SECRET` = `ваш-секретный-ключ-сессии`
- `GOOGLE_CLIENT_ID` = `ваш-google-client-id`
- `GOOGLE_CLIENT_SECRET` = `ваш-google-client-secret`
- `GOOGLE_CALLBACK_URL` = `https://ваш-backend-url.onrender.com/api/auth/google/callback`
- `TELEGRAM_BOT_TOKEN` = `ваш-telegram-bot-token`

#### Для Frontend сервиса:
- `REACT_APP_API_URL` = `https://ваш-backend-url.onrender.com`
- `REACT_APP_WS_URL` = `https://ваш-backend-url.onrender.com`

### 2. Настройка Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID
5. Добавьте в Authorized redirect URIs:
   - `https://ваш-backend-url.onrender.com/api/auth/google/callback`

### 3. Настройка Telegram Bot

1. Найдите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный Bot Token

## 🚀 Пошаговое развёртывание

### Вариант A: Автоматическое развёртывание (рекомендуется)

1. **Создание Blueprint:**
   - Войдите в [Render Dashboard](https://dashboard.render.com/)
   - Нажмите "New +" → "Blueprint"
   - Подключите ваш GitHub репозиторий
   - Render автоматически создаст один проект с тремя сервисами
   - Нажмите "Create Blueprint Instance"

2. **Настройка переменных окружения:**
   - После создания перейдите в каждый сервис
   - Добавьте необходимые переменные окружения (см. ниже)

### Вариант B: Ручное создание

#### Шаг 1: Создание проекта

1. Войдите в [Render Dashboard](https://dashboard.render.com/)
2. Нажмите "New +" → "Web Service" (или "Blueprint")
3. Подключите ваш GitHub репозиторий
4. Заполните форму:
   - **Name**: `social-marketplace`
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
5. Нажмите "Create Web Service"

#### Шаг 2: Добавление PostgreSQL Database

1. В созданном проекте нажмите "New +" → "PostgreSQL"
2. Заполните форму:
   - **Name**: `social-marketplace-db`
   - **Database**: `social_marketplace`
   - **User**: `postgres` (по умолчанию)
   - **Plan**: Free
3. Нажмите "Create Database"

#### Шаг 3: Добавление Frontend

1. В том же проекте нажмите "New +" → "Static Site"
2. Подключите тот же GitHub репозиторий
3. Заполните форму:
   - **Name**: `social-marketplace-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: Free
4. Нажмите "Create Static Site"

### Шаг 4: Инициализация базы данных

После создания всех сервисов:

1. Перейдите в ваш backend сервис
2. В разделе "Logs" найдите URL для доступа к консоли
3. Выполните команду:
   ```bash
   npm run init-db
   ```

## 🔧 Автоматическое развёртывание с render.yaml

Альтернативно, вы можете использовать файл `render.yaml` для автоматического развёртывания всех сервисов:

1. Убедитесь, что файл `render.yaml` находится в корне репозитория
2. В Render Dashboard нажмите "New +" → "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Render автоматически создаст все сервисы согласно конфигурации
5. После создания добавьте переменные окружения вручную

## 🔍 Проверка развёртывания

### Проверка Backend:
- Откройте URL backend сервиса + `/api/health`
- Должен вернуться JSON: `{"status":"ok","message":"Backend API is running!"}`

### Проверка Frontend:
- Откройте URL frontend сервиса
- Должна загрузиться главная страница приложения

### Проверка базы данных:
- В логах backend должны быть сообщения об успешном подключении к БД

## 🐛 Устранение неполадок

### Проблемы с CORS:
- Убедитесь, что в backend настроены правильные домены Render
- Проверьте переменные окружения frontend

### Проблемы с базой данных:
- Проверьте SSL настройки для production
- Убедитесь, что переменные окружения БД правильно настроены

### Проблемы с WebSocket:
- Проверьте, что frontend использует правильный URL для WebSocket
- Убедитесь, что CORS настроен для WebSocket соединений

### Проблемы с OAuth:
- Проверьте, что callback URL в Google Console соответствует URL backend
- Убедитесь, что переменные Google OAuth правильно настроены

## 📝 Полезные команды

### Локальное тестирование production сборки:
```bash
# Backend
cd backend
npm install
NODE_ENV=production npm start

# Frontend
cd frontend
npm install
npm run build
npx serve -s build
```

### Проверка переменных окружения:
```bash
# Backend
echo $NODE_ENV
echo $DB_HOST

# Frontend
echo $REACT_APP_API_URL
```

## 🔒 Безопасность

### Рекомендации для production:
1. Используйте сильные секретные ключи для JWT и сессий
2. Настройте HTTPS (автоматически в Render)
3. Ограничьте доступ к базе данных
4. Регулярно обновляйте зависимости
5. Мониторьте логи на предмет подозрительной активности

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения настроены
3. Проверьте подключение к базе данных
4. Обратитесь к документации Render.com

---

**Удачного развёртывания! 🎉** 