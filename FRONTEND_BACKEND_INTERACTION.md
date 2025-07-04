# Взаимодействие модулей Frontend ↔ Backend

## 1. Архитектура взаимодействия

### Общая схема
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  App.jsx (Главный компонент)                               │
│  ├── AppBar.jsx (Навигация)                                │
│  ├── SidebarLeft.jsx (Меню)                                │
│  ├── SidebarRight.jsx (Чат)                                │
│  ├── Feed.jsx (Лента постов)                               │
│  ├── ChatDialog.jsx (Диалог чата)                          │
│  ├── Analytics.jsx (Аналитика)                             │
│  ├── Notifications.jsx (Уведомления)                       │
│  ├── Gamification.jsx (Геймификация)                       │
│  ├── UserSettings.jsx (Настройки)                          │
│  └── Search.jsx (Поиск)                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                       │
├─────────────────────────────────────────────────────────────┤
│  app.js (Главный сервер)                                   │
│  ├── Routes (API маршруты)                                 │
│  │   ├── auth.js (Аутентификация)                          │
│  │   ├── users.js (Пользователи)                           │
│  │   ├── posts.js (Посты)                                  │
│  │   ├── comments.js (Комментарии)                         │
│  │   ├── reactions.js (Реакции)                            │
│  │   ├── feed.js (Лента)                                   │
│  │   ├── messages.js (Сообщения)                           │
│  │   └── telegram.js (Telegram)                            │
│  ├── Controllers (Бизнес-логика)                           │
│  ├── Models (Модели данных)                                │
│  ├── Middleware (Промежуточное ПО)                         │
│  └── WebSocket (Socket.io)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Database (PostgreSQL)                       │
└─────────────────────────────────────────────────────────────┘
```

## 2. Детальное взаимодействие модулей

### 2.1 Аутентификация

#### Frontend → Backend
```javascript
// App.jsx → authController.js
const handleGoogleLogin = () => {
  // 1. Перенаправление на Google OAuth
  window.location.href = 'http://localhost:8000/api/auth/google';
};

// OAuthSuccess.jsx → authController.js
const handleOAuthSuccess = async (token) => {
  // 2. Сохранение JWT токена
  localStorage.setItem('authToken', token);
  
  // 3. Загрузка текущего пользователя
  const user = await api.getCurrentUser();
  setCurrentUser(user);
};
```

#### Backend → Frontend
```javascript
// authController.js → OAuthSuccess.jsx
const googleCallback = (req, res) => {
  // 1. Получение профиля от Google
  const profile = req.user;
  
  // 2. Создание/обновление пользователя в БД
  const user = await User.findByProvider('google', profile.id);
  
  // 3. Генерация JWT токена
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  
  // 4. Перенаправление на фронтенд с токеном
  res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
};
```

### 2.2 Управление постами

#### Frontend → Backend
```javascript
// Feed.jsx → postController.js
const createPost = async (content) => {
  // 1. Отправка POST запроса
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, privacy: 'public' })
  });
  
  // 2. Обновление состояния
  const newPost = await response.json();
  setFeedData(prev => ({
    ...prev,
    posts: [newPost, ...prev.posts]
  }));
};

// Feed.jsx → postController.js
const loadPosts = async () => {
  // 1. Загрузка постов
  const posts = await api.getPosts();
  
  // 2. Загрузка реакций пользователя
  const reactions = await api.getUserReactions();
  
  // 3. Загрузка комментариев
  const comments = await api.getComments();
  
  setFeedData({ posts, userReactions: reactions, comments });
};
```

#### Backend → Frontend
```javascript
// postController.js → Feed.jsx
const createPost = async (req, res) => {
  // 1. Валидация JWT токена
  const user = req.user;
  
  // 2. Создание поста в БД
  const post = await Post.create({
    user_id: user.id,
    content: req.body.content,
    privacy: req.body.privacy
  });
  
  // 3. Возврат созданного поста
  res.json(post);
};

// postController.js → Feed.jsx
const getPosts = async (req, res) => {
  // 1. Получение постов из БД
  const posts = await Post.findAll({
    where: { privacy: 'public' },
    order: [['created_at', 'DESC']]
  });
  
  // 2. Возврат постов
  res.json(posts);
};
```

### 2.3 Real-time сообщения (WebSocket)

#### Frontend → Backend
```javascript
// SidebarRight.jsx → Socket.io Server
const sendMessage = (receiverId, content) => {
  // 1. Отправка сообщения через WebSocket
  socket.emit('sendMessage', {
    receiverId,
    content,
    senderId: currentUser.id,
    senderUsername: currentUser.username
  });
  
  // 2. Обновление локального состояния
  setChats(prev => ({
    ...prev,
    [receiverId]: {
      ...prev[receiverId],
      messages: [...prev[receiverId].messages, {
        text: content,
        isUser: true,
        timestamp: Date.now()
      }]
    }
  }));
};

// App.jsx → Socket.io Server
const joinChat = () => {
  // 1. Присоединение к чату
  socket.emit('join', {
    userId: currentUser.id,
    username: currentUser.username,
    avatarUrl: currentUser.avatar
  });
};
```

#### Backend → Frontend
```javascript
// Socket.io Server → SidebarRight.jsx
socket.on('sendMessage', async (data) => {
  // 1. Сохранение сообщения в БД
  const message = await Message.create(
    data.senderId,
    data.receiverId,
    data.content
  );
  
  // 2. Отправка сообщения получателю
  const receiverSocket = onlineUsers.get(data.receiverId);
  if (receiverSocket) {
    io.to(receiverSocket.socketId).emit('newMessage', {
      ...message,
      sender_username: data.senderUsername
    });
  }
  
  // 3. Подтверждение отправителю
  socket.emit('messageSent', message);
});

// Socket.io Server → SidebarRight.jsx
socket.on('join', (userData) => {
  // 1. Сохранение пользователя в онлайн
  onlineUsers.set(socket.id, userData);
  
  // 2. Уведомление всех о новом пользователе
  io.emit('userJoined', userData);
  
  // 3. Отправка списка онлайн пользователей
  const usersList = Array.from(onlineUsers.values());
  socket.emit('onlineUsers', usersList);
});
```

### 2.4 Комментарии и реакции

#### Frontend → Backend
```javascript
// PostCard.jsx → commentController.js
const addComment = async (postId, content) => {
  const comment = await api.createComment({
    post_id: postId,
    content
  });
  
  // Обновление состояния комментариев
  setFeedData(prev => ({
    ...prev,
    comments: {
      ...prev.comments,
      [postId]: [...(prev.comments[postId] || []), comment]
    }
  }));
};

// PostCard.jsx → reactionController.js
const addReaction = async (postId, reactionType) => {
  const reaction = await api.createReaction({
    post_id: postId,
    reaction_type: reactionType
  });
  
  // Обновление состояния реакций
  setFeedData(prev => ({
    ...prev,
    userReactions: {
      ...prev.userReactions,
      [postId]: reactionType
    }
  }));
};
```

### 2.5 Поиск и фильтрация

#### Frontend → Backend
```javascript
// Search.jsx → userController.js
const searchUsers = async (query) => {
  const users = await api.searchUsers(query);
  setSearchResults(users);
};

// Feed.jsx → feedController.js
const filterPosts = async (filters) => {
  const posts = await api.getFilteredPosts(filters);
  setFeedData(prev => ({ ...prev, posts }));
};
```

## 3. Состояние и синхронизация

### 3.1 Управление состоянием Frontend
```javascript
// App.jsx - Главное состояние
const [currentUser, setCurrentUser] = useState(null);
const [feedData, setFeedData] = useState({
  posts: [],
  userReactions: {},
  comments: {}
});
const [chats, setChats] = useState({});
const [realUsers, setRealUsers] = useState([]);

// Синхронизация с Backend
useEffect(() => {
  if (currentUser) {
    loadPosts();
    loadUsers();
    loadNotifications();
  }
}, [currentUser]);
```

### 3.2 Кэширование и оптимизация
```javascript
// services/api.js - Кэширование запросов
const cache = new Map();

const apiRequest = async (endpoint, options = {}) => {
  const cacheKey = `${options.method || 'GET'}_${endpoint}`;
  
  // Проверка кэша
  if (options.method === 'GET' && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await fetch(url, config);
  const data = await response.json();
  
  // Сохранение в кэш
  if (options.method === 'GET') {
    cache.set(cacheKey, data);
  }
  
  return data;
};
```

## 4. Обработка ошибок

### 4.1 Frontend обработка ошибок
```javascript
// services/api.js - Глобальная обработка ошибок
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Токен истек - перенаправление на логин
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Показать уведомление пользователю
    showNotification('error', 'Ошибка соединения с сервером');
    throw error;
  }
};
```

### 4.2 Backend обработка ошибок
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      error: 'Ошибка валидации',
      details: err.details
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Неавторизованный доступ'
    });
  }
  
  res.status(500).json({
    error: 'Внутренняя ошибка сервера'
  });
};
```

## 5. Безопасность

### 5.1 JWT валидация
```javascript
// middleware/checkAdmin.js
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
};
```

### 5.2 CORS настройки
```javascript
// app.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.0.102:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 6. Мониторинг и логирование

### 6.1 Frontend логирование
```javascript
// services/api.js - Логирование API запросов
const apiRequest = async (endpoint, options = {}) => {
  const startTime = Date.now();
  
  console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, config);
    const duration = Date.now() - startTime;
    
    console.log(`API Response: ${response.status} ${endpoint} (${duration}ms)`);
    
    return await response.json();
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`API Error: ${error.message} ${endpoint} (${duration}ms)`);
    throw error;
  }
};
```

### 6.2 Backend логирование
```javascript
// app.js - Логирование запросов
app.use((req, res, next) => {
  const startTime = Date.now();
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});
```

## 7. Производительность

### 7.1 Оптимизация запросов
```javascript
// Backend - Пагинация
const getPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const posts = await Post.findAll({
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
  
  res.json({
    posts,
    pagination: {
      page,
      limit,
      hasMore: posts.length === limit
    }
  });
};
```

### 7.2 Lazy loading
```javascript
// Frontend - Ленивая загрузка компонентов
const Analytics = lazy(() => import('./components/Analytics'));
const Gamification = lazy(() => import('./components/Gamification'));

// Условная загрузка
{analyticsOpen && (
  <Suspense fallback={<CircularProgress />}>
    <Analytics />
  </Suspense>
)}
```

Эта документация описывает все аспекты взаимодействия между фронтендом и бэкендом, что поможет OCR боту понять, как тестировать каждый сценарий взаимодействия пользователей. 