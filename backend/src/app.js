const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger for startup (before main logger is loaded)
const startupLogger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`);
  }
};

// Try to load logger, but don't fail if it doesn't work
let logger;
try {
  logger = require('./utils/logger');
} catch (error) {
  startupLogger.error(`Failed to load logger: ${error.message}`);
  logger = startupLogger;
}

// Intercept console.log and console.error for logging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// INFO — only to log file
console.log = (...args) => {
  const message = args.join(' ');
  try {
    logger.info(message);
  } catch (error) {
    originalConsoleLog(`[LOGGER ERROR] ${error.message}: ${message}`);
  }
  // Don't output to console
};

// ERROR — both to log and console (in red)
console.error = (...args) => {
  const message = args.join(' ');
  try {
    logger.error(message);
  } catch (error) {
    originalConsoleError(`[LOGGER ERROR] ${error.message}: ${message}`);
  }
};

// Function for outputting startup messages to console
const startupLog = (...args) => {
  const message = args.join(' ');
  originalConsoleLog(`[STARTUP] ${message}`);
  try {
    logger.startup(message);
  } catch (error) {
    originalConsoleLog(`[LOGGER ERROR] ${error.message}: ${message}`);
  }
};

// Intercept unhandled errors
process.on('uncaughtException', (error) => {
  try {
    logger.critical('Uncaught Exception', { 
      message: error.message, 
      stack: error.stack,
      name: error.name 
    });
  } catch (logError) {
    originalConsoleError(`[CRITICAL LOGGER ERROR] ${logError.message}`);
    originalConsoleError(`[ORIGINAL ERROR] ${error.message}`);
    originalConsoleError(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  try {
    logger.critical('Unhandled Rejection', { 
      reason: reason?.toString(), 
      promise: promise?.toString() 
    });
  } catch (logError) {
    originalConsoleError(`[CRITICAL LOGGER ERROR] ${logError.message}`);
    originalConsoleError(`[UNHANDLED REJECTION] ${reason}`);
  }
});

// Startup messages and environment variables — explicitly to console
startupLog('Environment variables loaded:');
startupLog(`  HOST: ${process.env.HOST || 'not set'}`);
startupLog(`  PORT: ${process.env.PORT || 'not set'}`);
startupLog(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
startupLog(`  DB_HOST: ${process.env.DB_HOST || 'not set'}`);
startupLog(`  DB_USER: ${process.env.DB_USER || 'not set'}`);
startupLog(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}`);
startupLog(`  DB_PASSWORD type: ${typeof process.env.DB_PASSWORD}`);
startupLog(`  DATABASE_URL: ${process.env.DATABASE_URL ? '***SET***' : 'NOT SET'}`);

// Try to load routes, but don't fail if some don't work
const loadRoute = (routePath, routeName) => {
  try {
    return require(routePath);
  } catch (error) {
    startupLogger.error(`Failed to load route ${routeName}: ${error.message}`);
    // Return a simple router that logs the error
    const express = require('express');
    const router = express.Router();
    router.use('*', (req, res) => {
      res.status(503).json({ 
        error: `${routeName} route not available`, 
        message: 'Service temporarily unavailable' 
      });
    });
    return router;
  }
};

// Import routes with error handling
const usersRouter = loadRoute('./routes/users', 'users');
const postsRouter = loadRoute('./routes/posts', 'posts');
const commentsRouter = loadRoute('./routes/comments', 'comments');
const reactionsRouter = loadRoute('./routes/reactions', 'reactions');
const feedRouter = loadRoute('./routes/feed', 'feed');
const authRouter = loadRoute('./routes/auth', 'auth');
const telegramRouter = loadRoute('./routes/telegram', 'telegram');
const messagesRouter = loadRoute('./routes/messages', 'messages');
const notificationsRouter = loadRoute('./routes/notifications', 'notifications');
const logsRouter = loadRoute('./routes/logs', 'logs');
const placeholderRouter = loadRoute('./routes/placeholder', 'placeholder');
const adminRouter = loadRoute('./routes/admin', 'admin');
const syslogRouter = loadRoute('./routes/syslog', 'syslog');

const app = express();
const server = http.createServer(app);

// Initialize syslog server
let syslogServer = null;
try {
  const SyslogServer = require('./utils/syslogServer');
  const syslogPort = parseInt(process.env.SYSLOG_PORT) || 514;
  
  if (process.env.ENABLE_SYSLOG === 'true') {
    syslogServer = new SyslogServer(syslogPort, logger);
    app.locals.syslogServer = syslogServer;
    
    // Start syslog server
    syslogServer.start()
      .then(() => {
        startupLog(`Syslog server started on port ${syslogPort}`);
        logger.startup(`Syslog server started on port ${syslogPort}`);
      })
      .catch((error) => {
        startupLogger.error(`Failed to start syslog server: ${error.message}`);
        logger.error(`Failed to start syslog server: ${error.message}`);
      });
  } else {
    startupLog('Syslog server disabled (ENABLE_SYSLOG not set to true)');
  }
} catch (error) {
  startupLogger.error(`Failed to initialize syslog server: ${error.message}`);
  logger.error(`Failed to initialize syslog server: ${error.message}`);
}

// Try to initialize socket.io, but don't fail if it doesn't work
let io;
try {
  io = socketIo(server, {
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
    try {
      logger.info('User connected', { socketId: socket.id });
    } catch (error) {
      startupLogger.error(`WebSocket connection error: ${error.message}`);
    }

    // User joins chat
    socket.on('join', async (userData) => {
      try {
        const { userId, username, avatarUrl } = userData;
        
        // Try to load socketManager, but don't fail if it doesn't work
        let socketManager;
        try {
          socketManager = require('./utils/socketManager');
          socketManager.addOnlineUser(socket.id, { userId, username, avatarUrl });
        } catch (error) {
          startupLogger.error(`SocketManager error: ${error.message}`);
        }
        
        // Notify everyone about new user
        io.emit('userJoined', { userId, username, avatarUrl, socketId: socket.id });
        
        // Send list of all online users
        if (socketManager) {
          const usersList = socketManager.getOnlineUsers();
          socket.emit('onlineUsers', usersList);
        }
        
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
      } catch (error) {
        startupLogger.error(`WebSocket join error: ${error.message}`);
      }
    });

    // Send message
    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, content, senderId, senderUsername } = data;
        logger.info('Message received via WebSocket', { receiverId, content, senderId, senderUsername });
        
        // Save message to database
        const Message = require('./models/message');
        const message = await Message.create(senderId, receiverId, content);
        logger.info('Message saved to database', message);
        
        // Send message to recipient via WebSocket
        try {
          const socketManager = require('./utils/socketManager');
          socketManager.sendMessageNotification(message, senderUsername, io);
        } catch (error) {
          startupLogger.error(`SocketManager sendMessage error: ${error.message}`);
        }
        
        // Send confirmation to sender
        socket.emit('messageSent', message);
        
      } catch (error) {
        logger.error('Error sending message', { error: error.message, senderId: data?.senderId, receiverId: data?.receiverId });
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // Notification delivery confirmation
    socket.on('notificationDelivered', async (data) => {
      try {
        const { notificationId } = data;
        
        // Try to get socketManager
        let socketManager;
        try {
          socketManager = require('./utils/socketManager');
        } catch (error) {
          startupLogger.error(`SocketManager error in notificationDelivered: ${error.message}`);
          return;
        }
        
        const user = socketManager.getUserBySocketId(socket.id);
        
        if (user && notificationId) {
          const Notification = require('./models/notification');
          await Notification.markAsDelivered(notificationId);
          logger.info(`Notification ${notificationId} marked as delivered for user ${user.userId}`);
        }
      } catch (error) {
        logger.error('Error marking notification as delivered', { error: error.message, notificationId: data?.notificationId });
      }
    });

    socket.on('disconnect', () => {
      try {
        logger.info('User disconnected', { socketId: socket.id });
        
        // Try to remove user from online list
        try {
          const socketManager = require('./utils/socketManager');
          socketManager.removeOnlineUser(socket.id);
        } catch (error) {
          startupLogger.error(`SocketManager disconnect error: ${error.message}`);
        }
      } catch (error) {
        startupLogger.error(`WebSocket disconnect error: ${error.message}`);
      }
    });
  });

} catch (error) {
  startupLogger.error(`Failed to initialize Socket.IO: ${error.message}`);
  io = null;
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin
    if (!origin) {
      logger.info('[CORS] Request without origin, allowing');
      return callback(null, true);
    }
    
    logger.info(`[CORS] Checking origin: ${origin}`);
    logger.info(`[CORS] NODE_ENV: ${process.env.NODE_ENV}, RENDER: ${process.env.RENDER}`);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.0.102:3000',
      'http://192.168.0.107:3000',
      'http://192.168.193.181:3000',
      /^http:\/\/192\.168\.\d+\.\d+:3000$/,  // Allow all IPs in range 192.168.x.x
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,   // Allow all IPs in range 10.x.x.x
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/  // Allow all IPs in range 172.16-31.x.x
    ];
    
    // Add Render domains in production
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      logger.info('[CORS] Adding Render domains to allowed origins');
      allowedOrigins.push(/^https:\/\/.*\.onrender\.com$/);
      allowedOrigins.push(/^https:\/\/.*\.render\.com$/);
    }
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        const matches = allowedOrigin.test(origin);
        if (matches) {
          logger.info(`[CORS] Origin ${origin} matches regex ${allowedOrigin}`);
        }
        return matches;
      }
      const matches = allowedOrigin === origin;
      if (matches) {
        logger.info(`[CORS] Origin ${origin} matches exact ${allowedOrigin}`);
      }
      return matches;
    });
    
    if (isAllowed) {
      logger.info(`[CORS] Origin ${origin} is allowed`);
      callback(null, true);
    } else {
      logger.warn(`[CORS] Origin ${origin} is not allowed`);
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
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
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
app.use('/api/logs', logsRouter);
app.use('/api/placeholder', placeholderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/syslog', syslogRouter);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API works!' });
});

// Endpoint for receiving logs from frontend
app.post('/api/client-log', (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Error in client-log endpoint', { error: error.message });
    res.status(500).json({ status: 'error', message: error.message });
  }
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

const PORT = process.env.BACKEND_PORT || process.env.PORT || 8000;
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
    try {
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
    } catch (error) {
      startupLogger.error(`Logger startup error: ${error.message}`);
    }
  } else {
    console.log('=== DEBUG: startupLogged was true, skipping startup messages ===');
  }
});

// Handle server errors
server.on('error', (error) => {
  try {
    logger.critical('Server error', { 
      message: error.message, 
      stack: error.stack,
      code: error.code 
    });
  } catch (logError) {
    originalConsoleError(`[CRITICAL LOGGER ERROR] ${logError.message}`);
    originalConsoleError(`[SERVER ERROR] ${error.message}`);
    originalConsoleError(error.stack);
  }
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  try {
    startupLog('Received SIGTERM, shutting down gracefully...');
    
    // Stop syslog server if running
    if (syslogServer && syslogServer.isRunning) {
      await syslogServer.stop();
      startupLog('Syslog server stopped');
    }
    
    // Close server
    server.close(() => {
      startupLog('Server closed');
      process.exit(0);
    });
  } catch (error) {
    startupLogger.error(`Error during graceful shutdown: ${error.message}`);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  try {
    startupLog('Received SIGINT, shutting down gracefully...');
    
    // Stop syslog server if running
    if (syslogServer && syslogServer.isRunning) {
      await syslogServer.stop();
      startupLog('Syslog server stopped');
    }
    
    // Close server
    server.close(() => {
      startupLog('Server closed');
      process.exit(0);
    });
  } catch (error) {
    startupLogger.error(`Error during graceful shutdown: ${error.message}`);
    process.exit(1);
  }
}); 