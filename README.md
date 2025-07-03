# Facebook-подобная социальная платформа

Полнофункциональная социальная платформа с современным React фронтендом и Node.js backend на PostgreSQL.

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+
- PostgreSQL 15+

### 1. Клонирование и настройка
```bash
git clone <repository-url>
cd social-platform
```

### 2. Настройка базы данных
```bash
# Запустите SQL скрипт для создания базы данных
psql -U postgres -f setup_database.sql
```

### 3. Запуск Backend
```bash
cd backend
npm install
echo "DATABASE_URL=postgresql://marketplace_user:1@localhost:5432/marketplace_db" > .env
node src/app.js
```
Backend будет доступен на `http://localhost:8000`

### 4. Запуск Frontend
```bash
cd frontend
npm install
npm start
```
Frontend будет доступен на `http://localhost:3000`

### 5. Проверка интеграции
```bash
node test_integration.js
```

## ✅ Что работает

### 🗄 База данных PostgreSQL
- ✅ 12 таблиц созданы (пользователи, посты, комментарии, реакции, чаты и др.)
- ✅ Тестовые данные загружены (3 пользователя, 4 поста)
- ✅ Индексы для оптимизации запросов

### 🔧 Backend API (Node.js + Express)
- ✅ RESTful API на порту 8000
- ✅ Подключение к PostgreSQL
- ✅ Аутентификация пользователей (bcrypt)
- ✅ CRUD операции для постов и пользователей
- ✅ CORS настроен для frontend
- ✅ Полная документация API

### 🎨 Frontend (React + Material-UI)
- ✅ Современный UI в стиле Facebook
- ✅ Загрузка постов с backend API
- ✅ Создание новых постов
- ✅ Система лайков с анимациями
- ✅ AI-ассистент для генерации контента
- ✅ Адаптивный дизайн для мобильных устройств

## 🔗 API Эндпоинты

### Основные эндпоинты:
- `GET /api/health` - Проверка здоровья API
- `GET /api/users` - Получить всех пользователей
- `POST /api/users/register` - Регистрация
- `POST /api/users/login` - Авторизация
- `GET /api/posts` - Получить все посты
- `POST /api/posts` - Создать пост

### Полная документация: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

## 🎯 Функциональность

### ✅ Реализовано
- **Пользователи**: регистрация, авторизация, профили
- **Посты**: создание, просмотр, медиа-контент, цветные фоны
- **Реакции**: лайки с анимациями и звуковыми эффектами
- **AI-ассистент**: помощь в создании постов
- **Адаптивный дизайн**: работает на всех устройствах
- **Real-time симуляция**: уведомления и обновления

### 🚧 В разработке
- Система комментариев
- Чат между пользователями
- Загрузка медиафайлов
- OAuth через социальные сети
- Аналитика и геймификация

## 🛠 Технологии

### Frontend
- React 18
- Material-UI (MUI)
- React Router
- Axios для API запросов

### Backend
- Node.js
- Express.js
- PostgreSQL
- bcrypt для хеширования паролей
- CORS, Helmet для безопасности

## 📊 Статистика проекта

### База данных
- **Таблиц**: 12
- **Пользователей**: 3 (тестовые)
- **Постов**: 4 (включая созданные через API)
- **Дружб**: 2

### API
- **Эндпоинтов**: 8+
- **Контроллеров**: 2 (пользователи, посты)
- **Маршрутов**: 2 модуля

## 🧪 Тестирование

Запустите тест интеграции:
```bash
node test_integration.js
```

Результаты тестирования:
- ✅ Backend API работает
- ✅ Frontend доступен
- ✅ База данных подключена
- ✅ CORS настроен
- ✅ Создание постов работает

## 🌐 Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/api/health

## 📁 Структура проекта

```
├── frontend/          # React приложение
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── services/      # API сервисы
│   │   └── config/        # Конфигурация
│   └── public/
├── backend/           # Node.js API
│   ├── src/
│   │   ├── controllers/   # Контроллеры
│   │   ├── routes/        # Маршруты API
│   │   ├── utils/         # Утилиты
│   │   └── app.js         # Основной файл приложения
│   ├── setup_database.sql # SQL скрипт настройки БД
│   └── API_DOCUMENTATION.md
├── setup_database.sql # Основной SQL скрипт
├── test_integration.js # Тест интеграции
└── README.md
```

## 🔧 Разработка

### Команды разработки

#### Backend
```bash
cd backend
npm install          # Установка зависимостей
node src/app.js      # Запуск сервера
```

#### Frontend
```bash
cd frontend
npm install          # Установка зависимостей
npm start           # Запуск в режиме разработки
npm run build       # Сборка для продакшена
```

### Переменные окружения

#### Backend (.env)
```
DATABASE_URL=postgresql://marketplace_user:1@localhost:5432/marketplace_db
```

## 🚀 Деплой

### Backend
- **Render.com** - бесплатный хостинг для Node.js
- **Railway** - простой деплой с PostgreSQL
- **Heroku** - классический выбор

### Frontend
- **Vercel** - отличный для React приложений
- **Netlify** - простой деплой
- **GitHub Pages** - бесплатный хостинг

### База данных
- **Supabase** - PostgreSQL с дополнительными функциями
- **Railway** - PostgreSQL хостинг
- **ElephantSQL** - бесплатный PostgreSQL

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License

## 🆘 Поддержка

Если у вас возникли проблемы:

1. **Проверьте, что PostgreSQL запущен**
2. **Убедитесь, что порты 3000 и 8000 свободны**
3. **Запустите тест интеграции**: `node test_integration.js`
4. **Проверьте логи в консоли**
5. **Создайте Issue в репозитории**

## 🎉 Готово к использованию!

Приложение полностью настроено и готово к использованию. Откройте http://localhost:3000 в браузере и наслаждайтесь!

### Демо-данные
- **Пользователи**: john_doe, jane_smith, bob_wilson
- **Посты**: уже созданы и загружаются с backend
- **Функции**: создание постов, лайки, AI-ассистент работают