// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

// Remove trailing slash if present
const cleanBaseUrl = (url) => url.replace(/\/$/, '');

export const API_CONFIG = {
  BASE_URL: cleanBaseUrl(API_BASE_URL),
  WS_URL: cleanBaseUrl(WS_BASE_URL),
  
  // API Endpoints
  ENDPOINTS: {
    USERS: '/api/users',
    AUTH_ME: '/api/auth/me',
    AUTH_GOOGLE: '/api/auth/google',
    NOTIFICATIONS: '/api/notifications',
    MESSAGES_CONVERSATIONS: '/api/messages/conversations',
    MESSAGES_CONVERSATION: (userId) => `/api/messages/conversation/${userId}`,
    MESSAGES_SEND: '/api/messages/send',
    HEALTH: '/api/health'
  },
  
  // Full URLs
  getUrl: (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`,
  getWsUrl: () => API_CONFIG.WS_URL
};

// Debug logging
console.log('API Configuration:', {
  BASE_URL: API_CONFIG.BASE_URL,
  WS_URL: API_CONFIG.WS_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_WS_URL: process.env.REACT_APP_WS_URL
});

export default API_CONFIG;

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