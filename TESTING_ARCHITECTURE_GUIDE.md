# Техническое руководство по тестированию архитектуры

## Ключевые точки тестирования

### 1. API Endpoints Testing

#### Health Check
```bash
curl -X GET http://localhost:8000/api/health
```
**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "message": "Backend API is running!",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Аутентификация
```bash
# Проверка Google OAuth
curl -X GET http://localhost:8000/api/auth/google

# Проверка текущего пользователя (требует JWT токен)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Пользователи
```bash
# Получение списка пользователей
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Создание пользователя
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

#### Посты
```bash
# Получение постов
curl -X GET http://localhost:8000/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Создание поста
curl -X POST http://localhost:8000/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Тестовый пост",
    "privacy": "public"
  }'
```

### 2. WebSocket Testing

#### Подключение к WebSocket
```javascript
// В браузере или Node.js с ws библиотекой
const socket = io('http://localhost:8000');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('onlineUsers', (users) => {
  console.log('Online users:', users);
});
```

#### Присоединение к чату
```javascript
socket.emit('join', {
  userId: '123',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.jpg'
});
```

#### Отправка сообщения
```javascript
socket.emit('sendMessage', {
  receiverId: '456',
  content: 'Привет!',
  senderId: '123',
  senderUsername: 'testuser'
});
```

### 3. База данных Testing

#### Подключение к PostgreSQL
```bash
psql -h localhost -p 5432 -U postgres -d social_marketplace
```

#### Проверка таблиц
```sql
-- Список всех таблиц
\dt

-- Проверка пользователей
SELECT id, username, email, created_at FROM users LIMIT 5;

-- Проверка постов
SELECT id, user_id, content, created_at FROM posts LIMIT 5;

-- Проверка сообщений
SELECT id, sender_id, receiver_id, content, created_at FROM messages LIMIT 5;
```

### 4. Frontend State Testing

#### Проверка состояния в браузере
```javascript
// В консоли браузера
console.log('Current user:', window.currentUser);
console.log('Auth token:', localStorage.getItem('authToken'));
console.log('API logs:', window.apiLogs);
```

#### Проверка WebSocket состояния
```javascript
// Проверка подключения к WebSocket
console.log('Socket connected:', window.socket?.connected);
console.log('Online users:', window.onlineUsers);
```

## Автоматизированное тестирование

### 1. API Tests (Node.js)

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

async function testAPI() {
  try {
    // Health check
    const health = await axios.get(`${API_BASE}/health`);
    console.log('Health check:', health.data);

    // Test without auth
    try {
      await axios.get(`${API_BASE}/users`);
      console.log('❌ Users endpoint should require auth');
    } catch (error) {
      console.log('✅ Users endpoint correctly requires auth');
    }

  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testAPI();
```

### 2. WebSocket Tests

```javascript
const io = require('socket.io-client');

function testWebSocket() {
  const socket = io('http://localhost:8000');

  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
    
    // Test join
    socket.emit('join', {
      userId: 'test123',
      username: 'testuser',
      avatarUrl: ''
    });
  });

  socket.on('onlineUsers', (users) => {
    console.log('✅ Received online users:', users);
  });

  socket.on('disconnect', () => {
    console.log('✅ WebSocket disconnected');
  });

  // Disconnect after 5 seconds
  setTimeout(() => {
    socket.disconnect();
  }, 5000);
}

testWebSocket();
```

### 3. Database Tests

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'social_marketplace',
  user: 'postgres',
  password: 'postgres'
});

async function testDatabase() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected');

    // Test users table
    const users = await client.query('SELECT COUNT(*) FROM users');
    console.log('Users count:', users.rows[0].count);

    // Test posts table
    const posts = await client.query('SELECT COUNT(*) FROM posts');
    console.log('Posts count:', posts.rows[0].count);

    client.release();
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
```

## Интеграционные тесты

### 1. Полный цикл аутентификации

```javascript
async function testFullAuthFlow() {
  try {
    // 1. Проверка health
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ API is running');

    // 2. Попытка доступа без токена
    try {
      await axios.get(`${API_BASE}/users`);
      console.log('❌ Should require auth');
    } catch (error) {
      console.log('✅ Correctly requires auth');
    }

    // 3. Google OAuth (требует ручного взаимодействия)
    console.log('🔗 Google OAuth URL:', `${API_BASE}/auth/google`);

  } catch (error) {
    console.error('Auth flow test failed:', error.message);
  }
}
```

### 2. Полный цикл создания поста

```javascript
async function testPostCreation(token) {
  try {
    // 1. Создание поста
    const post = await axios.post(`${API_BASE}/posts`, {
      content: 'Test post content',
      privacy: 'public'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Post created:', post.data.id);

    // 2. Получение поста
    const retrievedPost = await axios.get(`${API_BASE}/posts/${post.data.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Post retrieved:', retrievedPost.data);

    // 3. Добавление комментария
    const comment = await axios.post(`${API_BASE}/comments`, {
      post_id: post.data.id,
      content: 'Test comment'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Comment added:', comment.data.id);

  } catch (error) {
    console.error('Post creation test failed:', error.message);
  }
}
```

## Мониторинг производительности

### 1. API Response Times

```javascript
async function measureAPIPerformance() {
  const endpoints = [
    '/health',
    '/users',
    '/posts',
    '/feed'
  ];

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      await axios.get(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const duration = Date.now() - start;
      console.log(`${endpoint}: ${duration}ms`);
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
}
```

### 2. WebSocket Latency

```javascript
function measureWebSocketLatency() {
  const socket = io('http://localhost:8000');
  
  socket.on('connect', () => {
    const start = Date.now();
    
    socket.emit('sendMessage', {
      receiverId: 'test',
      content: 'ping',
      senderId: 'test',
      senderUsername: 'test'
    });

    socket.on('messageSent', () => {
      const latency = Date.now() - start;
      console.log(`WebSocket latency: ${latency}ms`);
      socket.disconnect();
    });
  });
}
```

## Отладка и логирование

### 1. Backend Logs

```javascript
// В app.js добавьте детальное логирование
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
```

### 2. Frontend Logs

```javascript
// В api.js добавьте логирование всех запросов
const apiRequest = async (endpoint, options = {}) => {
  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
  console.log('Request data:', options.body);
  
  const response = await fetch(url, config);
  console.log(`API Response: ${response.status} ${endpoint}`);
  
  return response;
};
```

### 3. WebSocket Logs

```javascript
// В app.js добавьте логирование WebSocket событий
io.on('connection', (socket) => {
  console.log(`WebSocket connected: ${socket.id}`);
  
  socket.on('join', (data) => {
    console.log(`User joined: ${data.username} (${data.userId})`);
  });
  
  socket.on('sendMessage', (data) => {
    console.log(`Message sent: ${data.senderUsername} -> ${data.receiverId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`WebSocket disconnected: ${socket.id}`);
  });
});
```

## Чек-лист тестирования

### ✅ Backend
- [ ] Сервер запускается без ошибок
- [ ] База данных подключена
- [ ] API endpoints отвечают
- [ ] JWT аутентификация работает
- [ ] Google OAuth настроен
- [ ] WebSocket сервер работает
- [ ] CORS настроен правильно

### ✅ Frontend
- [ ] Приложение загружается
- [ ] Компоненты рендерятся
- [ ] API запросы работают
- [ ] WebSocket подключается
- [ ] Состояние управляется правильно
- [ ] Роутинг работает
- [ ] Темизация работает

### ✅ Интеграция
- [ ] Аутентификация end-to-end
- [ ] Создание/чтение постов
- [ ] Комментарии работают
- [ ] Реакции работают
- [ ] Real-time сообщения
- [ ] Уведомления работают
- [ ] Поиск работает

### ✅ Производительность
- [ ] API response times < 500ms
- [ ] WebSocket latency < 100ms
- [ ] Database queries optimized
- [ ] Memory usage stable
- [ ] No memory leaks 