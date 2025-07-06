# 🗄️ backend/

**Эта папка содержит весь исходный код бэкенд-приложения (Node.js/Express).**

- Все контроллеры, модели, роуты, middleware, конфиги и серверная логика находятся только здесь.
- Если вопрос касается API, серверной логики, работы с базой данных, авторизации — ищите и работайте только с этой папкой.

---

> ⚠️ Для новых чатов с ИИ: если вопрос касается бэкенда, API, серверной части — всегда используй только содержимое этой папки!

# Backend - Facebook-подобная социальная платформа

RESTful API сервер на Node.js с Express и PostgreSQL для социальной платформы.

## 🛠 Технологии

- **Node.js** - среда выполнения
- **Express.js** - веб-фреймворк
- **PostgreSQL** - база данных
- **bcrypt** - хеширование паролей
- **CORS, Helmet** - безопасность
- **pg** - драйвер PostgreSQL

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+
- PostgreSQL 15+

### Установка и запуск

```bash
# Установка зависимостей
npm install

# Создание файла .env
echo "DATABASE_URL=postgresql://marketplace_user:1@localhost:5432/marketplace_db" > .env

# Запуск сервера
node src/app.js
```

Сервер будет доступен на `http://localhost:8000`

## 📁 Структура проекта

```
backend/
├── src/
│   ├── controllers/          # Контроллеры API
│   │   ├── userController.js # Управление пользователями
│   │   └── postController.js # Управление постами
│   ├── routes/               # Маршруты API
│   │   ├── users.js          # Маршруты пользователей
│   │   └── posts.js          # Маршруты постов
│   ├── utils/
│   │   └── db.js             # Подключение к базе данных
│   └── app.js                # Основной файл приложения
├── .env                      # Переменные окружения
├── package.json
├── README.md
└── API_DOCUMENTATION.md      # Полная документация API
```

## 🔗 API Эндпоинты

### Основные эндпоинты
- `GET /api/health` - проверка здоровья API
- `GET /api/users` - получение всех пользователей
- `POST /api/users/register` - регистрация пользователя
- `POST /api/users/login` - авторизация пользователя
- `GET /api/posts` - получение всех постов
- `POST /api/posts` - создание нового поста

### Полная документация
См. [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 🗄 База данных

### Подключение
```javascript
// src/utils/db.js
const pool = new Pool({
  user: 'marketplace_user',
  host: 'localhost',
  database: 'marketplace_db',
  password: '1',
  port: 5432,
});
```

### Таблицы
- `users` - пользователи
- `posts` - посты
- `comments` - комментарии
- `reactions` - реакции (лайки, эмодзи)
- `friendships` - дружба/подписки
- `notifications` - уведомления
- `chats` - чаты
- `messages` - сообщения
- `user_settings` - настройки пользователей
- `analytics` - аналитика
- `gamification` - геймификация

## 🔧 Контроллеры

### UserController
- `getUsers()` - получение всех пользователей
- `getUserById(id)` - получение пользователя по ID
- `registerUser(userData)` - регистрация
- `loginUser(credentials)` - авторизация
- `updateProfile(id, profileData)` - обновление профиля

### PostController
- `getPosts(params)` - получение постов с пагинацией
- `getPostById(id)` - получение поста по ID
- `createPost(postData)` - создание поста
- `updatePost(id, postData)` - обновление поста
- `deletePost(id)` - удаление поста
- `getUserPosts(userId)` - посты пользователя

## 🔒 Безопасность

### Аутентификация
- Хеширование паролей с bcrypt
- Проверка уникальности email/username
- Валидация входных данных

### CORS
```javascript
app.use(cors()); // Разрешен доступ с любого origin
```

### Helmet
```javascript
app.use(helmet()); // Заголовки безопасности
```

## 📊 Статистика

### База данных
- **Пользователей**: 3 (тестовые)
- **Постов**: 4 (включая созданные через API)
- **Таблиц**: 12

### API
- **Эндпоинтов**: 8+
- **Контроллеров**: 2
- **Маршрутов**: 2 модуля

## 🧪 Тестирование

### Проверка здоровья API
```bash
curl http://localhost:8000/api/health
```

### Тест интеграции
```bash
node ../test_integration.js
```

### Ручное тестирование
1. Проверьте подключение к базе данных
2. Протестируйте создание пользователя
3. Протестируйте создание поста
4. Проверьте получение данных

## 🚀 Деплой

### Render.com
```bash
# Подключите GitHub репозиторий
# Настройте переменные окружения
# Автоматический деплой при push
```

### Railway
```bash
# Подключите репозиторий
# Настройте PostgreSQL addon
# Автоматический деплой
```

### Heroku
```bash
# Создайте Procfile
# Настройте переменные окружения
# Подключите PostgreSQL addon
```

## 🔗 Ссылки

- **API**: http://localhost:8000
- **Health Check**: http://localhost:8000/api/health
- **Документация**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Основной README**: [../README.md](../README.md)

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Протестируйте API
5. Создайте Pull Request

---

**Backend API готов к использованию и интегрирован с frontend!** 🎉 