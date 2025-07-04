# Технические спецификации для тестирования

## 1. API Спецификации

### Базовый URL
```
Backend: http://localhost:8000
API Base: http://localhost:8000/api
WebSocket: ws://localhost:8000
```

### Заголовки запросов
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Accept': 'application/json'
}
```

### Стандартные ответы

#### Успешный ответ
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

#### Ошибка
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Коды ошибок
- `401` - Неавторизованный доступ
- `403` - Запрещенный доступ
- `404` - Ресурс не найден
- `422` - Ошибка валидации
- `500` - Внутренняя ошибка сервера

## 2. Модели данных

### User Model
```javascript
{
  id: "number",
  username: "string (unique)",
  email: "string (unique)",
  first_name: "string",
  last_name: "string",
  avatar_url: "string (optional)",
  bio: "string (optional)",
  google_id: "string (optional)",
  created_at: "timestamp",
  updated_at: "timestamp",
  last_login: "timestamp (optional)"
}
```

### Post Model
```javascript
{
  id: "number",
  user_id: "number (FK to users.id)",
  content: "string",
  media_urls: "string[] (optional)",
  media_type: "string (optional)",
  background_color: "string (optional)",
  privacy: "string (public|friends|private)",
  section: "string (optional)",
  location: "string (optional)",
  is_ai_generated: "boolean",
  ai_prompt: "string (optional)",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Comment Model
```javascript
{
  id: "number",
  post_id: "number (FK to posts.id)",
  user_id: "number (FK to users.id)",
  parent_id: "number (FK to comments.id, optional)",
  content: "string",
  media_url: "string (optional)",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Reaction Model
```javascript
{
  id: "number",
  user_id: "number (FK to users.id)",
  post_id: "number (FK to posts.id, optional)",
  comment_id: "number (FK to comments.id, optional)",
  reaction_type: "string (like|love|haha|wow|sad|angry)",
  emoji: "string (optional)",
  created_at: "timestamp"
}
```

### Message Model
```javascript
{
  id: "number",
  sender_id: "number (FK to users.id)",
  receiver_id: "number (FK to users.id)",
  content: "string",
  media_url: "string (optional)",
  message_type: "string (text|image|video|file)",
  is_ai_message: "boolean",
  reply_to_id: "number (FK to messages.id, optional)",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

## 3. WebSocket События

### Клиент → Сервер

#### join
```javascript
{
  userId: "string",
  username: "string",
  avatarUrl: "string (optional)"
}
```

#### sendMessage
```javascript
{
  receiverId: "string",
  content: "string",
  senderId: "string",
  senderUsername: "string"
}
```

### Сервер → Клиент

#### userJoined
```javascript
{
  userId: "string",
  username: "string",
  avatarUrl: "string",
  socketId: "string"
}
```

#### newMessage
```javascript
{
  id: "number",
  sender_id: "string",
  receiver_id: "string",
  content: "string",
  sender_username: "string",
  created_at: "timestamp"
}
```

#### onlineUsers
```javascript
[
  {
    userId: "string",
    username: "string",
    avatarUrl: "string",
    socketId: "string"
  }
]
```

## 4. Состояние Frontend

### Основное состояние приложения
```javascript
{
  // Пользователь
  currentUser: {
    id: "string",
    name: "string",
    email: "string",
    username: "string",
    avatar: "string",
    createdAt: "timestamp",
    authMethod: "string"
  } | null,
  
  // Чаты
  chats: {
    [userId: string]: {
      userId: "string",
      messages: [
        {
          text: "string",
          isUser: "boolean",
          timestamp: "number"
        }
      ]
    }
  },
  
  // Лента
  feedData: {
    posts: "Post[]",
    userReactions: "{ [postId: string]: string }",
    comments: "{ [postId: string]: Comment[] }"
  },
  
  // Пользователи
  realUsers: [
    {
      id: "string",
      name: "string",
      username: "string",
      email: "string",
      avatar: "string",
      isRealUser: "boolean",
      isAI: "boolean",
      isMe: "boolean"
    }
  ],
  
  // UI состояние
  activeChatId: "string" | null,
  themeName: "facebook" | "neon",
  leftSidebarOpen: "boolean",
  rightSidebarOpen: "boolean",
  
  // Диалоги
  analyticsOpen: "boolean",
  searchOpen: "boolean",
  notificationsOpen: "boolean",
  gamificationOpen: "boolean",
  settingsOpen: "boolean",
  
  // Загрузка
  loadingUser: "boolean",
  loadingUsers: "boolean"
}
```

## 5. Локальное хранилище

### Ключи localStorage
```javascript
{
  'authToken': 'string (JWT token)',
  'currentUser': 'string (JSON)',
  'theme': 'facebook' | 'neon'
}
```

### Ключи sessionStorage
```javascript
{
  'apiLogs': 'string[] (API request logs)',
  'socketConnected': 'boolean'
}
```

## 6. Конфигурация базы данных

### PostgreSQL настройки
```sql
-- Подключение
Host: localhost
Port: 5432
Database: social_marketplace
User: postgres
Password: postgres

-- Настройки пула соединений
Max connections: 20
Idle timeout: 30000ms
Connection timeout: 2000ms
```

### Индексы для оптимизации
```sql
-- Пользователи
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Посты
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_privacy ON posts(privacy);

-- Комментарии
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Реакции
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);

-- Сообщения
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

## 7. Конфигурация сервера

### Express.js настройки
```javascript
{
  port: 8000,
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.0.102:3000'],
    credentials: true
  },
  session: {
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    }
  },
  jwt: {
    secret: 'your-jwt-secret',
    expiresIn: '7d'
  }
}
```

### Socket.io настройки
```javascript
{
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.0.102:3000'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
}
```

## 8. Переменные окружения

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_marketplace
DB_USER=postgres
DB_PASSWORD=postgres

# Server
PORT=8000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Session
SESSION_SECRET=your-session-secret-key-change-this-in-production

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
```

### Frontend (config/api.js)
```javascript
{
  API_BASE_URL: 'http://localhost:8000/api',
  SOCKET_URL: 'http://localhost:8000',
  REQUEST_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
}
```

## 9. Логирование

### Backend логи
```javascript
// HTTP запросы
console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

// WebSocket события
console.log(`WebSocket connected: ${socket.id}`);
console.log(`User joined: ${data.username} (${data.userId})`);

// Ошибки базы данных
console.error('Database error:', error);

// OAuth события
console.log('Google profile:', profile);
```

### Frontend логи
```javascript
// API запросы
console.log('API Request:', { url, method, body });
console.log('API Response:', { status, data });

// WebSocket события
console.log('Socket connected:', socket.connected);
console.log('Message received:', message);

// Состояние приложения
console.log('Current user:', currentUser);
console.log('Feed data:', feedData);
```

## 10. Тестовые данные

### Тестовый пользователь
```javascript
{
  username: "testuser",
  email: "test@example.com",
  password: "password123",
  first_name: "Test",
  last_name: "User"
}
```

### Тестовый пост
```javascript
{
  content: "This is a test post for testing purposes",
  privacy: "public",
  section: "general"
}
```

### Тестовое сообщение
```javascript
{
  receiverId: "2",
  content: "Hello, this is a test message",
  senderId: "1",
  senderUsername: "testuser"
}
```

## 11. Метрики производительности

### Целевые показатели
```javascript
{
  apiResponseTime: "< 500ms",
  websocketLatency: "< 100ms",
  databaseQueryTime: "< 200ms",
  memoryUsage: "< 100MB",
  cpuUsage: "< 50%"
}
```

### Мониторинг
```javascript
// API response time
const start = Date.now();
const response = await fetch(url);
const duration = Date.now() - start;
console.log(`API ${url}: ${duration}ms`);

// Memory usage
const memUsage = process.memoryUsage();
console.log(`Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);

// Database query time
const queryStart = Date.now();
const result = await db.query(sql, params);
const queryTime = Date.now() - queryStart;
console.log(`Query time: ${queryTime}ms`);
```

## 12. Безопасность

### JWT токены
```javascript
{
  algorithm: "HS256",
  expiresIn: "7d",
  issuer: "social-marketplace",
  audience: "social-marketplace-users"
}
```

### Валидация входных данных
```javascript
// Пользователь
{
  username: "string, 3-50 chars, alphanumeric",
  email: "valid email format",
  password: "string, min 8 chars",
  first_name: "string, 1-50 chars",
  last_name: "string, 1-50 chars"
}

// Пост
{
  content: "string, max 10000 chars",
  privacy: "enum: public, friends, private",
  media_urls: "array of valid URLs"
}

// Сообщение
{
  content: "string, max 5000 chars",
  receiverId: "valid user ID"
}
```

### CORS настройки
```javascript
{
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
``` 