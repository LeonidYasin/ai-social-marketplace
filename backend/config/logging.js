// Logging configuration
module.exports = {
  // Logging levels
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  
  // Current logging level
  currentLevel: process.env.LOG_LEVEL || 'INFO',
  
  // Log files configuration
  files: {
    backend: 'backend.log',
    frontend: 'frontend.log',
    errors: 'errors.log',
    access: 'access.log'
  },
  
  // Maximum log file size (in MB)
  maxFileSize: process.env.LOG_MAX_SIZE || 50,
  
  // Number of days to retain logs
  retentionDays: process.env.LOG_RETENTION_DAYS || 7,
  
  // Environment-specific settings
  environments: {
    development: {
      level: 'DEBUG',
      consoleOutput: true,
      fileOutput: true,
      colors: true
    },
    production: {
      level: 'INFO',
      consoleOutput: false,
      fileOutput: true,
      colors: false
    },
    test: {
      level: 'ERROR',
      consoleOutput: false,
      fileOutput: false,
      colors: false
    }
  },
  
  // Filters to exclude certain messages
  filters: {
    // Exclude redundant messages
    excludePatterns: [
      /\[getUsers\] Request received for user list/,
      /\[getUsers\] Users found:/,
      /Getting notifications for user/,
      /createPost: Request body:/,
      /createPost: User from token:/,
      /createPost: User ID from token:/,
      /createPost: About to execute SQL with params:/,
      /createPost: SQL executed successfully/,
      /SocketManager: Sending notification for message:/,
      /SocketManager: io available:/,
      /SocketManager: Recipient not found for chat/,
      /SocketManager: Recipient found with ID:/,
      /SocketManager: Online users:/,
      /User joining chat/,
      /Sending \d+ unread notifications to user/,
      /Sending \d+ undelivered notifications to user/,
      /User .* joined chat/,
      /postsAPI\.getPosts called/,
      /postsAPI\.getPosts result:/,
      /Fetching users from API/,
      /API response status:/,
      /API response data:/
    ],
    
    // Include only important messages in console
    consoleOnlyPatterns: [
      /Server started on port/,
      /API available at:/,
      /Network access available at:/,
      /Google OAuth:/,
      /WebSocket server running on port/,
      /Backend server listening on/,
      /Backend initialization completed successfully/,
      /Environment variables loaded:/,
      /HOST:/,
      /PORT:/,
      /NODE_ENV:/
    ]
  },
  
  // Formatting settings
  formatting: {
    timestamp: true,
    level: true,
    colors: process.env.NODE_ENV !== 'production',
    maxDataDepth: 3,
    truncateLongStrings: 1000
  }
}; 