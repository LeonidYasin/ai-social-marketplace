import { API_CONFIG, API_STATUS, ERROR_MESSAGES } from '../config/api';

const API_BASE_URL = 'http://localhost:8000/api';

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
      console.error('postsAPI.getPosts error:', error);
      throw error;
    }
  },

  // Создать пост
  createPost: async (postData) => {
    try {
      return await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
    } catch (error) {
      // Отправляем лог на backend
      sendClientLog('error', 'Ошибка создания поста', {
        postData,
        error: error.message
      });
      throw error;
    }
  },

  // Получить пост по ID
  getPost: async (postId) => {
    return apiRequest(`/posts/${postId}`);
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
    return apiRequest(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    });
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
    return apiRequest(`/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(reactionData)
    });
  }
};

// OAuth аутентификация
export const oauthAPI = {
  // Инициализация Google OAuth
  initGoogleAuth: () => {
    window.location.href = 'http://localhost:8000/api/auth/google';
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
    await fetch('http://localhost:8000/api/client-log', {
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