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

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

// Intercept console.log and console.error for logging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// INFO — only to log file
console.log = (...args) => {
  const message = args.join(' ');
  logger.info(message);
  // Don't output to console
};

// ERROR — both to log and console (in red)
console.error = (...args) => {
  const message = args.join(' ');
  logger.error(message);
};

// Function for outputting startup messages to console
const startupLog = (...args) => {
  const message = args.join(' ');
  originalConsoleLog(`[STARTUP] ${message}`);
  logger.startup(message);
};

// Intercept unhandled errors
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

// Import routes
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const reactionsRouter = require('./routes/reactions');
const feedRouter = require('./routes/feed');
const authRouter = require('./routes/auth');
const telegramRouter = require('./routes/telegram');
const messagesRouter = require('./routes/messages');
const notificationsRouter = require('./routes/notifications');

// Startup messages and environment variables — explicitly to console
logger.startup('Environment variables loaded:');
logger.startup(`  HOST: ${process.env.HOST || 'not set'}`);
logger.startup(`  PORT: ${process.env.PORT || 'not set'}`);
logger.startup(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
logger.startup(`  DB_HOST: ${process.env.DB_HOST || 'not set'}`);
logger.startup(`  DB_USER: ${process.env.DB_USER || 'not set'}`);
logger.startup(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
logger.startup(`  DB_PASSWORD type: ${typeof process.env.DB_PASSWORD}`);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests without origin
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://192.168.0.102:3000',
        'http://192.168.0.107:3000',
        'http://192.168.193.181:3000',
        /^http:\/\/192\.168\.\d+\.\d+:3000$/,  // Allow all IPs in range 192.168.x.x
        /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,   // Allow all IPs in range 10.x.x.x
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/  // Allow all IPs in range 172.16-31.x.x
      ];
      
      // Add Render domain in production
      if (process.env.NODE_ENV === 'production') {
        allowedOrigins.push(/^https:\/\/.*\.onrender\.com$/);
        allowedOrigins.push(/^https:\/\/.*\.render\.com$/);
      }
      
      // Check if origin is allowed
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return allowedOrigin === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

// Make io available to other modules
app.locals.io = io;

// WebSocket handlers
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });

  // User joins chat
  socket.on('join', async (userData) => {
    const { userId, username, avatarUrl } = userData;
    
    socketManager.addOnlineUser(socket.id, { userId, username, avatarUrl });
    
    // Notify everyone about new user
    io.emit('userJoined', { userId, username, avatarUrl, socketId: socket.id });
    
    // Send list of all online users
    const usersList = socketManager.getOnlineUsers();
    socket.emit('onlineUsers', usersList);
    
    // Send unread notifications to user
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

  // Send message
  socket.on('sendMessage', async (data) => {
    const { receiverId, content, senderId, senderUsername } = data;
    logger.info('Message received via WebSocket', { receiverId, content, senderId, senderUsername });
    
    try {
      // Save message to database
      const Message = require('./models/message');
      const message = await Message.create(senderId, receiverId, content);
      logger.info('Message saved to database', message);
      
      // Send message to recipient via WebSocket
      socketManager.sendMessageNotification(message, senderUsername, io);
      
      // Send confirmation to sender
      socket.emit('messageSent', message);
      
    } catch (error) {
      logger.error('Error sending message', { error: error.message, senderId, receiverId });
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Notification delivery confirmation
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

  // Notification read confirmation
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

  // User disconnects
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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (e.g., mobile apps)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.0.102:3000',
      'http://192.168.0.107:3000',
      'http://192.168.193.181:3000',
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,  // Allow all IPs in range 192.168.x.x
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,   // Allow all IPs in range 10.x.x.x
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/  // Allow all IPs in range 172.16-31.x.x
    ];
    
    // Add Render domain in production
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(/^https:\/\/.*\.onrender\.com$/);
      allowedOrigins.push(/^https:\/\/.*\.render\.com$/);
    }
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // In production should be true
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Error handler for body-parser and other middleware
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    // JSON parsing error
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
  
  // Other middleware errors
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

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/reactions', reactionsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/auth', authRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API works!' });
});

// Endpoint for receiving logs from frontend
app.post('/api/client-log', (req, res) => {
  const { level = 'info', message, data } = req.body;
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [FRONTEND][${level.toUpperCase()}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  const logFile = path.join(__dirname, '..', 'logs', 'frontend.log');
  
  fs.appendFileSync(logFile, logEntry);
  
  // Output backend logs only for errors
  if (level === 'error') {
    logger.error(`[FRONTEND] ${message}`, data || '');
  }
  
  res.json({ status: 'ok' });
});

// Global error handler for all routes
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

// 404 error handler
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

// Get IP addresses for display
const os = require('os');
const networkInterfaces = os.networkInterfaces();
const ipAddresses = [];

Object.keys(networkInterfaces).forEach((interfaceName) => {
  networkInterfaces[interfaceName].forEach((interface) => {
    // Skip IPv6 and loopback addresses
    if (interface.family === 'IPv4' && !interface.internal) {
      ipAddresses.push(interface.address);
    }
  });
});

// Protect from duplicate startup messages
let startupLogged = false;

// Temporary debug messages
console.log('=== DEBUG: About to start server ===');
console.log(`PORT: ${PORT}`);
console.log(`HOST: ${HOST}`);
console.log(`ipAddresses: ${JSON.stringify(ipAddresses)}`);

server.listen(PORT, HOST, () => {
  console.log('=== DEBUG: Server.listen callback executed ===');
  
  // Check if startup messages have not been output yet
  if (!startupLogged) {
    console.log('=== DEBUG: startupLogged was false, logging startup messages ===');
    startupLogged = true;
    
    // Explicit startup messages to console and log file
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
    
    // Also through logger
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