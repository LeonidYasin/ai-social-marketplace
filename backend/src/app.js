const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');
const socketManager = require('./utils/socketManager');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

// Перехватываем console.log и console.error для записи в лог
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// INFO — только в лог-файл
console.log = (...args) => {
  const message = args.join(' ');
  logger.info(message);
  // В консоль не выводим
};

// ERROR — и в лог, и в консоль (красным)
console.error = (...args) => {
  const message = args.join(' ');
  logger.error(message);
};

// Функция для вывода стартовых сообщений в консоль
const startupLog = (...args) => {
  const message = args.join(' ');
  originalConsoleLog(`[STARTUP] ${message}`);
  logger.startup(message);
};

// Перехватываем необработанные ошибки
process.on('uncaughtException', (error) => {
  logger.critical('Uncaught Exception', { 
    message: error.message, 
    stack: error.stack,
    name: error.name 
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.critical('Unhandled Rejection', { 
    reason: reason?.toString(), 
    promise: promise?.toString() 
  });
});

// Импорт маршрутов
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const reactionsRouter = require('./routes/reactions');
const feedRouter = require('./routes/feed');
const authRouter = require('./routes/auth');
const telegramRouter = require('./routes/telegram');
const messagesRouter = require('./routes/messages');
const notificationsRouter = require('./routes/notifications');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

// Стартовые сообщения и переменные окружения — явно в консоль
logger.startup('Environment variables loaded:');
logger.startup(`  HOST: ${process.env.HOST || 'not set'}`);
logger.startup(`  PORT: ${process.env.PORT || 'not set'}`);
logger.startup(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://192.168.0.102:3000',
      'http://192.168.0.107:3000',
      'http://192.168.193.181:3000',
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,  // Разрешаем все IP в диапазоне 192.168.x.x
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,   // Разрешаем все IP в диапазоне 10.x.x.x
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/  // Разрешаем все IP в диапазоне 172.16-31.x.x
    ],
    credentials: true
  }
});

// Делаем io доступным для других модулей
app.locals.io = io;

// WebSocket обработчики
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });

  // Пользователь присоединяется к чату
  socket.on('join', async (userData) => {
    const { userId, username, avatarUrl } = userData;
    
    socketManager.addOnlineUser(socket.id, { userId, username, avatarUrl });
    
    // Уведомляем всех о новом пользователе
    io.emit('userJoined', { userId, username, avatarUrl, socketId: socket.id });
    
    // Отправляем список всех онлайн пользователей
    const usersList = socketManager.getOnlineUsers();
    socket.emit('onlineUsers', usersList);
    
    // Отправляем непрочитанные уведомления пользователю
    try {
      const Notification = require('./models/notification');
      const unreadNotifications = await Notification.getUnreadByUserId(userId);
      const undeliveredNotifications = await Notification.getUndeliveredByUserId(userId);
      
      if (unreadNotifications.length > 0) {
        socket.emit('unreadNotifications', unreadNotifications);
      }
      
      if (undeliveredNotifications.length > 0) {
        socket.emit('undeliveredNotifications', undeliveredNotifications);
      }
          } catch (error) {
        logger.error('Error loading notifications', { error: error.message, userId });
      }
  });

  // Отправка сообщения
  socket.on('sendMessage', async (data) => {
    const { receiverId, content, senderId, senderUsername } = data;
    logger.info('Message received via WebSocket', { receiverId, content, senderId, senderUsername });
    
    try {
      // Сохраняем сообщение в базе данных
      const Message = require('./models/message');
      const message = await Message.create(senderId, receiverId, content);
      logger.info('Message saved to database', message);
      
      // Отправляем сообщение получателю через WebSocket
      socketManager.sendMessageNotification(message, senderUsername, io);
      
      // Отправляем подтверждение отправителю
      socket.emit('messageSent', message);
      
    } catch (error) {
      logger.error('Error sending message', { error: error.message, senderId, receiverId });
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Подтверждение доставки уведомления
  socket.on('notificationDelivered', async (data) => {
    const { notificationId } = data;
    const user = socketManager.getUserBySocketId(socket.id);
    
    if (user && notificationId) {
      try {
        const Notification = require('./models/notification');
        await Notification.markAsDelivered(notificationId);
        logger.info(`Notification ${notificationId} marked as delivered for user ${user.userId}`);
      } catch (error) {
        logger.error('Error marking notification as delivered', { error: error.message, notificationId, userId: user.userId });
      }
    }
  });

  // Подтверждение прочтения уведомления
  socket.on('notificationRead', async (data) => {
    const { notificationId } = data;
    const user = socketManager.getUserBySocketId(socket.id);
    
    if (user && notificationId) {
      try {
        const Notification = require('./models/notification');
        await Notification.markAsRead(notificationId);
        logger.info(`Notification ${notificationId} marked as read for user ${user.userId}`);
      } catch (error) {
        logger.error('Error marking notification as read', { error: error.message, notificationId, userId: user.userId });
      }
    }
  });

  // Пользователь отключается
  socket.on('disconnect', () => {
    const user = socketManager.getUserBySocketId(socket.id);
    if (user) {
      socketManager.removeOnlineUser(socket.id);
      io.emit('userLeft', { userId: user.userId, username: user.username });
      logger.info(`User ${user.username} (${user.userId}) left chat`);
    }
  });
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.0.102:3000',
    'http://192.168.0.107:3000',
    'http://192.168.193.181:3000',
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,  // Разрешаем все IP в диапазоне 192.168.x.x
    /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,   // Разрешаем все IP в диапазоне 10.x.x.x
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/  // Разрешаем все IP в диапазоне 172.16-31.x.x
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

// Обработчик ошибок для body-parser и других middleware
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    // Ошибка парсинга JSON
    logger.error('JSON parsing error', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(400).json({
      error: 'Invalid JSON format',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Другие ошибки middleware
  logger.error('Middleware error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  return res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

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
app.use('/api/notifications', notificationsRouter);

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ message: 'API работает!' });
});

// Endpoint для приёма логов с фронта
app.post('/api/client-log', (req, res) => {
  const { level = 'info', message, data } = req.body;
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [FRONTEND][${level.toUpperCase()}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  const logFile = path.join(__dirname, '..', 'logs', 'frontend.log');
  
  fs.appendFileSync(logFile, logEntry);
  
  // Выводим в консоль backend только ошибки
  if (level === 'error') {
    logger.error(`[FRONTEND] ${message}`, data || '');
  }
  
  res.json({ status: 'ok' });
});

// Глобальный обработчик ошибок для всех маршрутов
app.use((error, req, res, next) => {
  logger.error('Unhandled route error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Обработчик 404 ошибок
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// Получаем IP адреса для отображения
const os = require('os');
const networkInterfaces = os.networkInterfaces();
const ipAddresses = [];

Object.keys(networkInterfaces).forEach((interfaceName) => {
  networkInterfaces[interfaceName].forEach((interface) => {
    // Пропускаем IPv6 и loopback адреса
    if (interface.family === 'IPv4' && !interface.internal) {
      ipAddresses.push(interface.address);
    }
  });
});

// Защита от дублирования стартовых сообщений
let startupLogged = false;

// Временные отладочные сообщения
console.log('=== DEBUG: About to start server ===');
console.log(`PORT: ${PORT}`);
console.log(`HOST: ${HOST}`);
console.log(`ipAddresses: ${JSON.stringify(ipAddresses)}`);

server.listen(PORT, HOST, () => {
  console.log('=== DEBUG: Server.listen callback executed ===');
  
  // Проверяем, что стартовые сообщения еще не были выведены
  if (!startupLogged) {
    console.log('=== DEBUG: startupLogged was false, logging startup messages ===');
    startupLogged = true;
    
    // Стартовые сообщения явно в консоль и в лог-файл
    startupLog(`Server started on port ${PORT}`);
    startupLog(`API available at: http://${HOST}:${PORT}/api`);
    if (ipAddresses.length > 0) {
      startupLog('Network access available at:');
      ipAddresses.forEach(ip => startupLog(`  http://${ip}:${PORT}/api`));
    }
    startupLog(`Google OAuth: http://${HOST}:${PORT}/api/auth/google`);
    startupLog(`WebSocket server running on port ${PORT}`);
    startupLog(`Backend server listening on ${HOST}:${PORT}`);
    startupLog('Backend initialization completed successfully');
    
    // Также через логгер
    logger.startup(`Server started on port ${PORT}`);
    logger.startup(`API available at: http://${HOST}:${PORT}/api`);
    if (ipAddresses.length > 0) {
      logger.startup('Network access available at:');
      ipAddresses.forEach(ip => logger.startup(`  http://${ip}:${PORT}/api`));
    }
    logger.startup(`Google OAuth: http://${HOST}:${PORT}/api/auth/google`);
    logger.startup(`WebSocket server running on port ${PORT}`);
    logger.startup(`Backend server listening on ${HOST}:${PORT}`);
    logger.startup('Backend initialization completed successfully');
  } else {
    console.log('=== DEBUG: startupLogged was true, skipping startup messages ===');
  }
}); 