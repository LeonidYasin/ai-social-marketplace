// API Configuration with automatic URL detection
const getApiUrl = () => {
  // 1. Если есть переменная окружения - используем её
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Если мы на Render.com - используем стандартный URL
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://social-marketplace-api.onrender.com';
  }
  
  // 3. Если мы на Vercel - используем Vercel URL
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://your-app.vercel.app/api';
  }
  
  // 4. Если мы на Netlify - используем Netlify URL
  if (window.location.hostname.includes('netlify.app')) {
    return 'https://your-app.netlify.app/.netlify/functions/api';
  }
  
  // 5. Если мы на Heroku - используем Heroku URL
  if (window.location.hostname.includes('herokuapp.com')) {
    return 'https://your-app.herokuapp.com';
  }
  
  // 6. По умолчанию - localhost для разработки
  return 'http://localhost:8000';
};

const getWsUrl = () => {
  // 1. Если есть переменная окружения - используем её
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  
  // 2. Автоматически определяем WebSocket URL на основе API URL
  const apiUrl = getApiUrl();
  
  if (apiUrl.includes('https://')) {
    return apiUrl.replace('https://', 'wss://');
  }
  
  if (apiUrl.includes('http://')) {
    return apiUrl.replace('http://', 'ws://');
  }
  
  // 3. По умолчанию
  return 'ws://localhost:8000';
};

const API_BASE_URL = getApiUrl();
const WS_BASE_URL = getWsUrl();

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
  REACT_APP_WS_URL: process.env.REACT_APP_WS_URL,
  HOSTNAME: window.location.hostname,
  DETECTION_METHOD: process.env.REACT_APP_API_URL ? 'Environment Variable' : 'Auto-detection'
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