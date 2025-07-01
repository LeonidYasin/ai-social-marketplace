// API Configuration for Telegram Backend
export const API_CONFIG = {
  // Base URLs
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  TELEGRAM_WEBHOOK_URL: process.env.REACT_APP_TELEGRAM_WEBHOOK || 'http://localhost:8000/webhook',
  
  // API Endpoints
  ENDPOINTS: {
    // Posts
    POSTS: '/api/posts',
    POST: (id) => `/api/posts/${id}`,
    POST_REACTIONS: (id) => `/api/posts/${id}/reactions`,
    POST_COMMENTS: (id) => `/api/posts/${id}/comments`,
    
    // Users
    USERS: '/api/users',
    USER: (id) => `/api/users/${id}`,
    USER_PROFILE: (id) => `/api/users/${id}/profile`,
    
    // Chat
    CHAT_MESSAGES: '/api/chat/messages',
    CHAT_SEND: '/api/chat/send',
    AI_CHAT: '/api/chat/ai',
    
    // Telegram Integration
    TELEGRAM_AUTH: '/api/telegram/auth',
    TELEGRAM_WEBHOOK: '/api/telegram/webhook',
    TELEGRAM_SEND: '/api/telegram/send',
    
    // Analytics
    ANALYTICS: '/api/analytics',
    USER_STATS: (id) => `/api/analytics/users/${id}/stats`,
    
    // Search
    SEARCH: '/api/search',
    SEARCH_POSTS: '/api/search/posts',
    SEARCH_USERS: '/api/search/users',
    
    // Notifications
    NOTIFICATIONS: '/api/notifications',
    NOTIFICATION_READ: (id) => `/api/notifications/${id}/read`,
    
    // Gamification
    ACHIEVEMENTS: '/api/achievements',
    USER_ACHIEVEMENTS: (id) => `/api/users/${id}/achievements`,
    LEADERBOARD: '/api/leaderboard',
  },
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Timeouts
  TIMEOUT: 10000, // 10 seconds
  
  // Retry configuration
  RETRY: {
    attempts: 3,
    delay: 1000,
  },
};

// API Response Status Codes
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение.',
  UNAUTHORIZED: 'Необходима авторизация.',
  FORBIDDEN: 'Доступ запрещен.',
  NOT_FOUND: 'Ресурс не найден.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  TIMEOUT: 'Превышено время ожидания.',
  UNKNOWN: 'Неизвестная ошибка.',
}; 