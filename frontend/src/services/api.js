import { API_CONFIG, API_STATUS, ERROR_MESSAGES } from '../config/api';

// Base API service class
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Get headers with auth token
  getHeaders() {
    const token = this.getAuthToken();
    return {
      ...this.defaultHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Base request method with retry logic
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      timeout: this.timeout,
      ...options,
    };

    let lastError;
    
    for (let attempt = 1; attempt <= API_CONFIG.RETRY.attempts; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (attempt < API_CONFIG.RETRY.attempts) {
          await new Promise(resolve => 
            setTimeout(resolve, API_CONFIG.RETRY.delay * attempt)
          );
        }
      }
    }
    
    throw lastError;
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Create API service instance
const apiService = new ApiService();

// Posts API
export const postsAPI = {
  // Get all posts
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiService.get(`${API_CONFIG.ENDPOINTS.POSTS}?${queryString}`);
  },

  // Get single post
  getById: (id) => apiService.get(API_CONFIG.ENDPOINTS.POST(id)),

  // Create new post
  create: (postData) => apiService.post(API_CONFIG.ENDPOINTS.POSTS, postData),

  // Update post
  update: (id, postData) => apiService.put(API_CONFIG.ENDPOINTS.POST(id), postData),

  // Delete post
  delete: (id) => apiService.delete(API_CONFIG.ENDPOINTS.POST(id)),

  // Add reaction to post
  addReaction: (id, reaction) => 
    apiService.post(API_CONFIG.ENDPOINTS.POST_REACTIONS(id), { reaction }),

  // Remove reaction from post
  removeReaction: (id, reaction) => 
    apiService.delete(`${API_CONFIG.ENDPOINTS.POST_REACTIONS(id)}?reaction=${reaction}`),

  // Get post comments
  getComments: (id) => apiService.get(API_CONFIG.ENDPOINTS.POST_COMMENTS(id)),

  // Add comment to post
  addComment: (id, comment) => 
    apiService.post(API_CONFIG.ENDPOINTS.POST_COMMENTS(id), comment),
};

// Users API
export const usersAPI = {
  // Get all users
  getAll: () => apiService.get(API_CONFIG.ENDPOINTS.USERS),

  // Get user by ID
  getById: (id) => apiService.get(API_CONFIG.ENDPOINTS.USER(id)),

  // Get user profile
  getProfile: (id) => apiService.get(API_CONFIG.ENDPOINTS.USER_PROFILE(id)),

  // Update user profile
  updateProfile: (id, profileData) => 
    apiService.put(API_CONFIG.ENDPOINTS.USER_PROFILE(id), profileData),
};

// Chat API
export const chatAPI = {
  // Get chat messages
  getMessages: (chatId) => 
    apiService.get(`${API_CONFIG.ENDPOINTS.CHAT_MESSAGES}?chatId=${chatId}`),

  // Send message
  sendMessage: (messageData) => 
    apiService.post(API_CONFIG.ENDPOINTS.CHAT_SEND, messageData),

  // Send AI message
  sendAIMessage: (message) => 
    apiService.post(API_CONFIG.ENDPOINTS.AI_CHAT, { message }),
};

// Telegram API
export const telegramAPI = {
  // Authenticate with Telegram
  authenticate: (telegramData) => 
    apiService.post(API_CONFIG.ENDPOINTS.TELEGRAM_AUTH, telegramData),

  // Send message via Telegram
  sendMessage: (messageData) => 
    apiService.post(API_CONFIG.ENDPOINTS.TELEGRAM_SEND, messageData),
};

// Analytics API
export const analyticsAPI = {
  // Get general analytics
  getGeneral: () => apiService.get(API_CONFIG.ENDPOINTS.ANALYTICS),

  // Get user stats
  getUserStats: (userId) => apiService.get(API_CONFIG.ENDPOINTS.USER_STATS(userId)),
};

// Search API
export const searchAPI = {
  // General search
  search: (query, filters = {}) => 
    apiService.post(API_CONFIG.ENDPOINTS.SEARCH, { query, filters }),

  // Search posts
  searchPosts: (query, filters = {}) => 
    apiService.post(API_CONFIG.ENDPOINTS.SEARCH_POSTS, { query, filters }),

  // Search users
  searchUsers: (query) => 
    apiService.post(API_CONFIG.ENDPOINTS.SEARCH_USERS, { query }),
};

// Notifications API
export const notificationsAPI = {
  // Get notifications
  getAll: () => apiService.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS),

  // Mark notification as read
  markAsRead: (id) => apiService.patch(API_CONFIG.ENDPOINTS.NOTIFICATION_READ(id)),
};

// Gamification API
export const gamificationAPI = {
  // Get achievements
  getAchievements: () => apiService.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS),

  // Get user achievements
  getUserAchievements: (userId) => 
    apiService.get(API_CONFIG.ENDPOINTS.USER_ACHIEVEMENTS(userId)),

  // Get leaderboard
  getLeaderboard: () => apiService.get(API_CONFIG.ENDPOINTS.LEADERBOARD),
};

export default apiService; 