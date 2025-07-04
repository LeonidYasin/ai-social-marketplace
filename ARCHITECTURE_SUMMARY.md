# Краткое резюме архитектуры Social Marketplace

## 🏗️ Общая структура

**Frontend (React + MUI)** ←→ **Backend (Node.js + Express)** ←→ **Database (PostgreSQL)**

## 🔧 Технологии

### Frontend
- React 18 + Material-UI
- React Router для навигации
- Socket.io-client для real-time
- LocalStorage для состояния

### Backend  
- Node.js + Express.js
- PostgreSQL + pg
- Socket.io для WebSocket
- Passport.js + JWT для аутентификации
- Google OAuth

## 📁 Ключевые файлы

### Backend
```
app.js                    # Главный сервер
├── routes/              # API маршруты
├── controllers/         # Бизнес-логика
├── models/             # Модели данных
├── middleware/         # Middleware
└── utils/db.js         # Подключение к БД
```

### Frontend
```
App.jsx                 # Главный компонент
├── components/         # UI компоненты
├── services/api.js     # API клиент
└── config/            # Конфигурация
```

## 🔄 Основные потоки

### 1. Аутентификация
```
User → Google OAuth → Backend → JWT Token → Frontend Storage
```

### 2. Создание поста
```
Frontend → API POST /posts → Controller → Model → Database
```

### 3. Real-time сообщения
```
User A → WebSocket → Socket.io → Database → User B
```

## 🗄️ База данных

### Основные таблицы
- `users` - пользователи
- `posts` - посты
- `comments` - комментарии  
- `reactions` - реакции
- `messages` - сообщения
- `notifications` - уведомления

## 🔌 API Endpoints

### Аутентификация
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/me` - текущий пользователь

### Основные
- `GET/POST /api/users` - пользователи
- `GET/POST /api/posts` - посты
- `GET/POST /api/comments` - комментарии
- `GET/POST /api/messages` - сообщения

## 🌐 WebSocket события

### Клиент → Сервер
- `join` - присоединение к чату
- `sendMessage` - отправка сообщения

### Сервер → Клиент  
- `newMessage` - новое сообщение
- `userJoined/userLeft` - статус пользователей

## 🔐 Безопасность

- JWT токены (7 дней)
- Google OAuth
- bcrypt для паролей
- CORS настроен
- Валидация входных данных

## 📊 Состояние приложения

```javascript
{
  currentUser: null,        // Текущий пользователь
  chats: {},               // Активные чаты
  feedData: {              // Лента постов
    posts: [],
    userReactions: {},
    comments: {}
  },
  realUsers: [],           // Список пользователей
  // UI состояние
  activeChatId: null,
  themeName: 'facebook',
  leftSidebarOpen: true,
  rightSidebarOpen: true
}
```

## 🚀 Запуск

### Backend
```bash
cd backend
npm install
# Настроить config.env
npm start
# http://localhost:8000
```

### Frontend
```bash
cd frontend  
npm install
npm start
# http://localhost:3000
```

### База данных
```bash
# PostgreSQL на localhost:5432
# База: social_marketplace
# Выполнить: setup_database.sql
```

## 🧪 Тестирование

### API Health Check
```bash
curl http://localhost:8000/api/health
```

### WebSocket
```javascript
const socket = io('http://localhost:8000');
socket.emit('join', { userId: 'test', username: 'test' });
```

### База данных
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;
```

## 📈 Мониторинг

### Логи
- Backend: консоль сервера
- Frontend: консоль браузера
- API: window.apiLogs
- WebSocket: события подключения

### Метрики
- API response time: < 500ms
- WebSocket latency: < 100ms
- Memory usage: < 100MB

## 🔧 Конфигурация

### Переменные окружения
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_marketplace
JWT_SECRET=your-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## 📋 Чек-лист запуска

- [ ] PostgreSQL запущен
- [ ] База данных создана
- [ ] Таблицы созданы
- [ ] config.env настроен
- [ ] Backend запущен (порт 8000)
- [ ] Frontend запущен (порт 3000)
- [ ] API health check проходит
- [ ] WebSocket подключается
- [ ] Google OAuth настроен

## 🚨 Известные ограничения

1. WebSocket состояние в памяти (не масштабируется)
2. Отсутствует кэширование
3. Нет unit тестов
4. JWT секреты в конфигурации

## 📚 Документация

- `ARCHITECTURE_DOCUMENTATION.md` - подробная архитектура
- `TESTING_ARCHITECTURE_GUIDE.md` - руководство по тестированию
- `MODULE_INTERACTION_DIAGRAMS.md` - диаграммы взаимодействия
- `TECHNICAL_SPECIFICATIONS.md` - технические спецификации
- `TESTING_CHECKLIST.md` - чек-лист тестирования 