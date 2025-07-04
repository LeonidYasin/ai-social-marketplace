const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');

// Импорт маршрутов
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const reactionsRouter = require('./routes/reactions');
const feedRouter = require('./routes/feed');
const authRouter = require('./routes/auth');
const telegramRouter = require('./routes/telegram');
const messagesRouter = require('./routes/messages');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://192.168.0.102:3000'
    ],
    credentials: true
  }
});

// Хранилище онлайн пользователей
const onlineUsers = new Map();

// WebSocket обработчики
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Пользователь присоединяется к чату
  socket.on('join', (userData) => {
    const { userId, username, avatarUrl } = userData;
    onlineUsers.set(socket.id, { userId, username, avatarUrl, socketId: socket.id });
    
    // Уведомляем всех о новом пользователе
    io.emit('userJoined', { userId, username, avatarUrl, socketId: socket.id });
    
    // Отправляем список всех онлайн пользователей
    const usersList = Array.from(onlineUsers.values());
    socket.emit('onlineUsers', usersList);
    
    console.log(`User ${username} (${userId}) joined chat`);
  });

  // Отправка сообщения
  socket.on('sendMessage', async (data) => {
    const { receiverId, content, senderId, senderUsername } = data;
    
    try {
      // Сохраняем сообщение в базе данных
      const Message = require('./models/message');
      const message = await Message.create(senderId, receiverId, content);
      
      // Отправляем сообщение получателю
      const receiverSocket = Array.from(onlineUsers.entries())
        .find(([_, user]) => user.userId === receiverId);
      
      if (receiverSocket) {
        io.to(receiverSocket[0]).emit('newMessage', {
          ...message,
          sender_username: senderUsername
        });
      }
      
      // Отправляем подтверждение отправителю
      socket.emit('messageSent', message);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Пользователь отключается
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      onlineUsers.delete(socket.id);
      io.emit('userLeft', { userId: user.userId, username: user.username });
      console.log(`User ${user.username} (${user.userId}) left chat`);
    }
  });
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.0.102:3000'
  ],
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // В продакшене должно быть true
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// Инициализация Passport
app.use(passport.initialize());
app.use(passport.session());

// Проверка здоровья API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

// Маршруты API
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/reactions', reactionsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/auth', authRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/messages', messagesRouter);

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ message: 'API работает!' });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}/api`);
  console.log(`Google OAuth: http://localhost:${PORT}/api/auth/google`);
  console.log(`WebSocket server running on port ${PORT}`);
}); 