import logger from './logging';
import { API_CONFIG, API_STATUS, ERROR_MESSAGES } from '../config/api';
import backendManager from './backendManager';

const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:8000/api';

// Функция для получения токена из localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Функция для сохранения токена
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Общая функция для API запросов
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Добавляем токен авторизации если есть
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    headers,
    ...options,
  };

  console.log('API Request:', { url, method: config.method || 'GET', body: config.body });
  console.log('API Request headers:', config.headers);
  
  // Логируем для автоматического тестирования
  if (typeof window !== 'undefined') {
    if (!window.apiLogs) window.apiLogs = [];
    window.apiLogs.push(`API Request: ${config.method || 'GET'} ${url}`);
  }

  try {
    const response = await fetch(url, config);
    console.log('API Response status:', response.status);
    console.log('API Response headers:', response.headers);
    
    const data = await response.json();
    console.log('API Response data:', data);
    
    // Логируем ответ для автоматического тестирования
    if (typeof window !== 'undefined') {
      if (!window.apiLogs) window.apiLogs = [];
      window.apiLogs.push(`API Response: ${response.status} ${url}`);
    }
    
    if (!response.ok) {
      // Если токен истек, удаляем его
      if (response.status === 401) {
        setAuthToken(null);
        localStorage.removeItem('currentUser');
      }
      throw new Error(data.error || 'Ошибка запроса');
    }
    
    return data;
  } catch (error) {
    console.error('API Error details:', {
      message: error.message,
      type: error.name,
      url: url,
      config: config
    });
    
    // Логируем ошибку для автоматического тестирования
    if (typeof window !== 'undefined') {
      if (!window.apiLogs) window.apiLogs = [];
      window.apiLogs.push(`API Error: ${error.message} ${url}`);
    }
    
    // Обрабатываем ошибку без всплывающих уведомлений
    const errorInfo = await backendManager.handleConnectionError(error, endpoint);
    // backendManager.showErrorNotification(errorInfo); // Отключаем всплывающие уведомления
    
    // Логируем ошибку
    logger.logApiError(config.method || 'GET', url, error);
    throw error;
  }
};

// Аутентификация
export const authAPI = {
  // Регистрация пользователя
  register: async (userData) => {
    const { username, email, password, first_name, last_name, bio } = userData;
    
    const response = await apiRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        first_name,
        last_name,
        bio: bio || ''
      })
    });
    
    // Сохраняем токен если он есть в ответе
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Вход пользователя
  login: async (credentials) => {
    const { username, password } = credentials;
    
    const response = await apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password
      })
    });
    
    // Сохраняем токен если он есть в ответе
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  // Получение текущего пользователя
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  // Получение пользователя по ID
  getUser: async (userId) => {
    return apiRequest(`/users/${userId}`);
  },

  // Обновление профиля
  updateProfile: async (userId, profileData) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Удаление пользователя
  deleteUser: async (userId) => {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Получить всех пользователей
  getUsers: async () => {
    return apiRequest('/users');
  },

  // Обновление роли пользователя
  updateUserRole: async (userId, newRole) => {
    return apiRequest(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    });
  },

  // Выход
  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('currentUser');
  },

  // Проверка авторизации
  isAuthenticated: () => {
    return !!getAuthToken();
  }
};

// Посты
export const postsAPI = {
  // Получить все посты
  getPosts: async () => {
    try {
      const result = await apiRequest('/posts');
      return result;
    } catch (error) {
      let errorMsg = 'Ошибка загрузки постов';
      if (error && error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Нет соединения с сервером. Проверьте подключение к интернету или работу бэкенда.';
        } else if (error.message.includes('401')) {
          errorMsg = 'Вы не авторизованы. Пожалуйста, войдите в систему.';
        } else if (error.message.includes('500')) {
          errorMsg = 'Внутренняя ошибка сервера или базы данных.';
        } else {
          errorMsg = 'Ошибка: ' + error.message;
        }
      }
      console.error('postsAPI.getPosts error:', error);
      // Отключаем alert и логирование
      // alert(errorMsg + (error && error.stack ? '\n' + error.stack : ''));
      // logger.logApiError('GET', '/posts', error);
      throw error;
    }
  },

  // Создать пост
  createPost: async (postData) => {
    try {
      console.log('🚀 postsAPI.createPost - Начинаем создание поста');
      console.log('📝 Данные поста:', postData);
      
      // Проверяем авторизацию
      const token = getAuthToken();
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }
      
      console.log('🔑 Токен найден:', token.substring(0, 20) + '...');
      
      const response = await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      
      console.log('✅ Пост создан успешно:', response);
      return response;
    } catch (error) {
      console.error('❌ postsAPI.createPost error:', error);
      
      // Отправляем лог на backend
      sendClientLog('error', 'Ошибка создания поста', {
        postData,
        error: error.message,
        stack: error.stack
      });
      
      // Логируем ошибку
      logger.logApiError('POST', '/posts', error);
      throw error;
    }
  },

  // Получить пост по ID
  getPost: async (postId) => {
    try {
      return await apiRequest(`/posts/${postId}`);
    } catch (error) {
      let errorMsg = 'Ошибка загрузки поста';
      if (error && error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Нет соединения с сервером. Проверьте подключение к интернету или работу бэкенда.';
        } else if (error.message.includes('401')) {
          errorMsg = 'Вы не авторизованы. Пожалуйста, войдите в систему.';
        } else if (error.message.includes('500')) {
          errorMsg = 'Внутренняя ошибка сервера или базы данных.';
        } else {
          errorMsg = 'Ошибка: ' + error.message;
        }
      }
      console.error('postsAPI.getPost error:', error);
      console.error(errorMsg + (error && error.stack ? '\n' + error.stack : ''));
      logger.logApiError('GET', `/posts/${postId}`, error);
      throw error;
    }
  },

  // Обновить пост
  updatePost: async (postId, postData) => {
    return apiRequest(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  },

  // Удалить пост
  deletePost: async (postId) => {
    return apiRequest(`/posts/${postId}`, {
      method: 'DELETE'
    });
  }
};

// Комментарии
export const commentsAPI = {
  // Получить комментарии к посту
  getComments: async (postId) => {
    return apiRequest(`/posts/${postId}/comments`);
  },

  // Добавить комментарий
  addComment: async (postId, commentData) => {
    try {
      return await apiRequest(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentData)
      });
    } catch (error) {
      let errorMsg = 'Ошибка добавления комментария';
      if (error && error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Нет соединения с сервером. Проверьте подключение к интернету или работу бэкенда.';
        } else if (error.message.includes('401')) {
          errorMsg = 'Вы не авторизованы. Пожалуйста, войдите в систему.';
        } else if (error.message.includes('500')) {
          errorMsg = 'Внутренняя ошибка сервера или базы данных.';
        } else {
          errorMsg = 'Ошибка: ' + error.message;
        }
      }
      console.error('commentsAPI.addComment error:', error);
      console.error(errorMsg + (error && error.stack ? '\n' + error.stack : ''));
      logger.logApiError('POST', `/posts/${postId}/comments`, error);
      throw error;
    }
  }
};

// Реакции
export const reactionsAPI = {
  // Получить реакции к посту
  getReactions: async (postId) => {
    return apiRequest(`/posts/${postId}/reactions`);
  },

  // Добавить/обновить реакцию
  addReaction: async (postId, reactionData) => {
    try {
      return await apiRequest(`/posts/${postId}/reactions`, {
        method: 'POST',
        body: JSON.stringify(reactionData)
      });
    } catch (error) {
      let errorMsg = 'Ошибка добавления реакции';
      if (error && error.message) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Нет соединения с сервером. Проверьте подключение к интернету или работу бэкенда.';
        } else if (error.message.includes('401')) {
          errorMsg = 'Вы не авторизованы. Пожалуйста, войдите в систему.';
        } else if (error.message.includes('500')) {
          errorMsg = 'Внутренняя ошибка сервера или базы данных.';
        } else {
          errorMsg = 'Ошибка: ' + error.message;
        }
      }
      console.error('reactionsAPI.addReaction error:', error);
      console.error(errorMsg + (error && error.stack ? '\n' + error.stack : ''));
      logger.logApiError('POST', `/posts/${postId}/reactions`, error);
      throw error;
    }
  }
};

// OAuth аутентификация
export const oauthAPI = {
  // Инициализация Google OAuth
  initGoogleAuth: () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/auth/google`;
  },

  // Обработка OAuth успеха
  handleOAuthSuccess: async (token, userData) => {
    // Сохраняем токен
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', userData);
    
    return {
      token,
      user: JSON.parse(decodeURIComponent(userData))
    };
  },

  // Проверка токена
  verifyToken: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Токен не найден');
    }

    return apiRequest('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Выход
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }
};

// Telegram OAuth
export const telegramAPI = {
  // Получение информации о боте
  getBotInfo: async () => {
    return apiRequest('/telegram/bot-info');
  },

  // Вход через Telegram
  login: async (telegramData) => {
    return apiRequest('/telegram/login', {
      method: 'POST',
      body: JSON.stringify(telegramData)
    });
  },

  // Инициализация Telegram Login Widget
  initTelegramWidget: (botUsername, onAuth) => {
    // Создаем Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', window.location.origin);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');
    
    script.onload = () => {
      // Telegram Widget автоматически обработает авторизацию
      window.TelegramLoginWidget = {
        dataOnauth: onAuth
      };
    };
    
    document.head.appendChild(script);
  }
};

// Функция для отправки логов на backend
export const sendClientLog = async (level, message, data) => {
  try {
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/client-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, data })
    });
  } catch (e) {
    // Не мешаем работе фронта, если лог не отправился
  }
};

// Функция для логирования в файл (через backend) - только для важных событий
export const logToFile = async (level, message, data = '') => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Отправляем на backend для записи в файл
  await sendClientLog(level, logEntry, data);
};

export default {
  auth: authAPI,
  oauth: oauthAPI,
  telegram: telegramAPI,
  posts: postsAPI,
  comments: commentsAPI,
  reactions: reactionsAPI
}; 