# Архитектура проекта Social Marketplace

## Обзор системы

Проект представляет собой социальную платформу типа Facebook с функциями маркетплейса, построенную на архитектуре клиент-сервер с использованием React (фронтенд) и Node.js/Express (бэкенд).

## Технологический стек

### Backend
- **Node.js** + **Express.js** - веб-сервер и API
- **PostgreSQL** - основная база данных
- **Socket.io** - WebSocket для real-time коммуникации
- **Passport.js** - аутентификация (Google OAuth)
- **JWT** - токены авторизации
- **bcrypt** - хеширование паролей
- **CORS** - междоменные запросы

### Frontend
- **React 18** - UI библиотека
- **Material-UI (MUI)** - компоненты интерфейса
- **React Router** - навигация
- **Socket.io-client** - WebSocket клиент
- **Axios** - HTTP клиент

## Архитектурные слои

### 1. Слой представления (Frontend)

#### Основные компоненты:
- **App.jsx** - корневой компонент приложения
- **AppBar.jsx** - верхняя панель навигации
- **SidebarLeft.jsx** - левая боковая панель
- **SidebarRight.jsx** - правая боковая панель
- **Feed.jsx** - лента постов
- **ChatDialog.jsx** - диалог чата
- **PostCard.jsx** - карточка поста
- **Analytics.jsx** - аналитика
- **Notifications.jsx** - уведомления
- **Gamification.jsx** - геймификация
- **UserSettings.jsx** - настройки пользователя

#### Сервисы:
- **api.js** - централизованный API клиент
- **config/api.js** - конфигурация API
- **config/themes.js** - темы оформления

### 2. Слой API (Backend)

#### Маршруты (Routes):
- **/api/auth** - аутентификация и авторизация
- **/api/users** - управление пользователями
- **/api/posts** - управление постами
- **/api/comments** - управление комментариями
- **/api/reactions** - управление реакциями
- **/api/feed** - лента постов
- **/api/messages** - сообщения
- **/api/telegram** - интеграция с Telegram

#### Контроллеры (Controllers):
- **authController.js** - логика аутентификации
- **userController.js** - управление пользователями
- **postController.js** - управление постами
- **messageController.js** - управление сообщениями
- **telegramController.js** - интеграция с Telegram

#### Модели (Models):
- **user.js** - модель пользователя
- **post.js** - модель поста
- **comment.js** - модель комментария
- **reaction.js** - модель реакции
- **message.js** - модель сообщения

### 3. Слой данных (Database)

#### Схема базы данных:
- **users** - пользователи
- **posts** - посты
- **comments** - комментарии
- **reactions** - реакции
- **messages** - сообщения
- **friendships** - дружба/подписки
- **notifications** - уведомления
- **chats** - чаты
- **chat_participants** - участники чатов
- **user_settings** - настройки пользователей
- **analytics** - аналитика
- **gamification** - геймификация

## Потоки данных

### 1. Аутентификация

```
Frontend → Google OAuth → Backend → Database
    ↓
JWT Token → Frontend Storage → API Requests
```

**Детальный поток:**
1. Пользователь кликает "Войти через Google"
2. Frontend перенаправляет на `/api/auth/google`
3. Backend инициализирует OAuth через Passport.js
4. Google возвращает профиль пользователя
5. Backend создает/обновляет пользователя в БД
6. Backend генерирует JWT токен
7. Frontend получает токен и сохраняет в localStorage
8. Все последующие запросы включают токен в заголовке Authorization

### 2. Управление постами

```
Frontend → API Request → Controller → Model → Database
    ↓
Response ← Controller ← Model ← Database
```

**Детальный поток:**
1. Пользователь создает пост через Feed.jsx
2. Frontend отправляет POST `/api/posts` с данными поста
3. postController.js валидирует данные и права доступа
4. post.js модель сохраняет пост в БД
5. Ответ возвращается через контроллер
6. Frontend обновляет состояние и отображает новый пост

### 3. Real-time сообщения

```
User A → WebSocket → Socket.io Server → Database
    ↓
User B ← WebSocket ← Socket.io Server ← Database
```

**Детальный поток:**
1. Пользователи подключаются к WebSocket серверу
2. При отправке сообщения:
   - Frontend отправляет событие 'sendMessage'
   - Socket.io сервер получает сообщение
   - Сообщение сохраняется в БД через message.js модель
   - Сервер отправляет сообщение получателю через 'newMessage'
   - Получатель получает сообщение и обновляет UI

## API Endpoints

### Аутентификация
- `GET /api/auth/google` - инициализация Google OAuth
- `GET /api/auth/google/callback` - callback Google OAuth
- `GET /api/auth/me` - получение текущего пользователя
- `POST /api/auth/refresh` - обновление токена

### Пользователи
- `GET /api/users` - список всех пользователей
- `GET /api/users/:id` - получение пользователя по ID
- `POST /api/users/register` - регистрация
- `POST /api/users/login` - вход
- `PUT /api/users/:id` - обновление профиля
- `DELETE /api/users/:id` - удаление пользователя

### Посты
- `GET /api/posts` - список постов
- `POST /api/posts` - создание поста
- `GET /api/posts/:id` - получение поста
- `PUT /api/posts/:id` - обновление поста
- `DELETE /api/posts/:id` - удаление поста

### Комментарии
- `GET /api/comments/:postId` - комментарии к посту
- `POST /api/comments` - создание комментария
- `PUT /api/comments/:id` - обновление комментария
- `DELETE /api/comments/:id` - удаление комментария

### Реакции
- `POST /api/reactions` - добавление реакции
- `DELETE /api/reactions/:id` - удаление реакции

### Сообщения
- `GET /api/messages/conversation/:userId` - история сообщений
- `GET /api/messages/conversations` - список диалогов

### Лента
- `GET /api/feed` - лента постов для пользователя

## WebSocket события

### Клиент → Сервер
- `join` - присоединение к чату
- `sendMessage` - отправка сообщения
- `disconnect` - отключение

### Сервер → Клиент
- `userJoined` - новый пользователь присоединился
- `userLeft` - пользователь покинул чат
- `newMessage` - новое сообщение
- `messageSent` - подтверждение отправки
- `messageError` - ошибка отправки
- `onlineUsers` - список онлайн пользователей

## Состояние приложения (Frontend)

### Основное состояние:
```javascript
{
  currentUser: null,           // текущий пользователь
  chats: {},                   // активные чаты
  feedData: {                  // данные ленты
    posts: [],
    userReactions: {},
    comments: {}
  },
  realUsers: [],              // список реальных пользователей
  activeChatId: null,         // активный чат
  themeName: 'facebook',      // текущая тема
  leftSidebarOpen: true,      // состояние левой панели
  rightSidebarOpen: true      // состояние правой панели
}
```

### Диалоги:
```javascript
{
  analyticsOpen: false,       // диалог аналитики
  searchOpen: false,          // диалог поиска
  notificationsOpen: false,   // диалог уведомлений
  gamificationOpen: false,    // диалог геймификации
  settingsOpen: false         // диалог настроек
}
```

## Безопасность

### Аутентификация:
- JWT токены с временем жизни 7 дней
- Google OAuth для социальной аутентификации
- Хеширование паролей с bcrypt

### Авторизация:
- Middleware `checkAdmin.js` для проверки токенов
- Проверка прав доступа на уровне контроллеров
- Валидация входных данных

### CORS:
- Настроен для localhost:3000 (frontend)
- Поддержка credentials для куки

## Конфигурация

### Переменные окружения (Backend):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_marketplace
DB_USER=postgres
DB_PASSWORD=postgres
PORT=8000
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret
```

### API конфигурация (Frontend):
```javascript
{
  API_BASE_URL: 'http://localhost:8000/api',
  SOCKET_URL: 'http://localhost:8000'
}
```

## Точки интеграции для тестирования

### 1. API Health Check
- `GET /api/health` - проверка работоспособности API

### 2. Аутентификация
- `GET /api/auth/google` - тест OAuth
- `GET /api/auth/me` - тест JWT токена

### 3. WebSocket
- Подключение к `ws://localhost:8000`
- События: `join`, `sendMessage`, `disconnect`

### 4. База данных
- Подключение к PostgreSQL на localhost:5432
- База данных: `social_marketplace`
- Пользователь: `postgres`

## Логирование и отладка

### Frontend логи:
- API запросы/ответы в консоли браузера
- WebSocket события
- Состояние приложения

### Backend логи:
- HTTP запросы
- WebSocket подключения
- Ошибки базы данных
- OAuth события

### Тестовые логи:
- Файлы в папке `test_logs/`
- Скриншоты в папке `test_screenshots/`

## Известные ограничения

1. **Безопасность**: JWT секреты в конфигурации (должны быть в переменных окружения)
2. **Масштабируемость**: WebSocket хранит состояние в памяти
3. **Производительность**: Отсутствуют кэш и оптимизация запросов
4. **Тестирование**: Нет unit и integration тестов

## Рекомендации для тестирования

1. **API тестирование**: Использовать Postman или curl для тестирования endpoints
2. **WebSocket тестирование**: Использовать wscat или WebSocket клиент
3. **UI тестирование**: Автоматизированные тесты с Puppeteer/Playwright
4. **База данных**: Проверка целостности данных и производительности запросов 