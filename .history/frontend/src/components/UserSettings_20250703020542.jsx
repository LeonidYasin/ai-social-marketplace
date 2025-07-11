import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Avatar,
  Divider,
  Stack,
  Chip,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ColorLens as ColorLensIcon,
  Edit as EditIcon,
  EmojiEvents as EmojiEventsIcon,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  GitHub as GitHubIcon,
  Public as VKIcon,
  Send,
  Chat,
  Email as EmailIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import DialogContentText from '@mui/material/DialogContentText';
import PostCard from './PostCard';
import Gamification from './Gamification';
import { authAPI, oauthAPI, telegramAPI } from '../services/api';

// Темы оформления
const THEMES = {
  light: { name: 'Светлая', icon: <LightModeIcon />, primary: '#1976d2' },
  dark: { name: 'Темная', icon: <DarkModeIcon />, primary: '#90caf9' },
  blue: { name: 'Синяя', icon: <ColorLensIcon />, primary: '#2196f3' },
  green: { name: 'Зеленая', icon: <ColorLensIcon />, primary: '#4caf50' },
  purple: { name: 'Фиолетовая', icon: <ColorLensIcon />, primary: '#9c27b0' },
};

// Социальные сети для регистрации
const SOCIAL_NETWORKS = [
  { 
    id: 'google', 
    name: 'Google', 
    icon: <GoogleIcon />, 
    color: '#DB4437',
    description: 'Войти через Google аккаунт'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: <FacebookIcon />, 
    color: '#4267B2',
    description: 'Войти через Facebook'
  },
  { 
    id: 'vk', 
    name: 'VKontakte', 
    icon: <VKIcon />, 
    color: '#4C75A3',
    description: 'Войти через VK'
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    icon: <Send />, 
    color: '#0088cc',
    description: 'Войти через Telegram'
  },
  { 
    id: 'github', 
    name: 'GitHub', 
    icon: <GitHubIcon />, 
    color: '#333',
    description: 'Войти через GitHub'
  },
  { 
    id: 'email', 
    name: 'Email', 
    icon: <EmailIcon />, 
    color: '#1976d2',
    description: 'Регистрация по email'
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    icon: <Chat />, 
    color: '#25D366',
    description: 'Войти через WhatsApp'
  },
];

// Разделы для фильтрации
const SECTIONS = [
  { value: 'all', label: 'Все разделы' },
  { value: 'tribune', label: 'Трибуна' },
  { value: 'video', label: 'Видео' },
  { value: 'sell', label: 'Продам' },
  { value: 'buy', label: 'Куплю' },
  { value: 'give', label: 'Отдам' },
  { value: 'realty', label: 'Недвижимость' },
];

// Настройки уведомлений
const NOTIFICATION_TYPES = [
  { key: 'newPosts', label: 'Новые посты', description: 'Уведомления о новых публикациях' },
  { key: 'reactions', label: 'Реакции', description: 'Когда кто-то реагирует на ваши посты' },
  { key: 'comments', label: 'Комментарии', description: 'Новые комментарии к вашим постам' },
  { key: 'mentions', label: 'Упоминания', description: 'Когда вас упоминают в комментариях' },
  { key: 'aiChat', label: 'AI чат', description: 'Уведомления от AI ассистента' },
];

// Mock posts for demo
const MOCK_POSTS = [
  { id: '1', userId: 'anna', text: 'Мой первый пост!', createdAt: '2024-05-01', images: [] },
  { id: '2', userId: 'ivan', text: 'Продаю велосипед', createdAt: '2024-05-02', images: [] },
  { id: '3', userId: 'anna', text: 'Куплю ноутбук', createdAt: '2024-05-03', images: [] },
];

const UserSettings = ({ open, onClose, onUserChange, posts = [] }) => {
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState({
    name: 'Александр',
    email: 'alex@example.com',
    bio: 'Люблю технологии и новые знакомства',
    avatar: null,
  });
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#1976d2');
  const [notifications, setNotifications] = useState({
    newPosts: true,
    reactions: true,
    comments: true,
    mentions: false,
    aiChat: true,
  });
  const [filters, setFilters] = useState({
    sections: ['all'],
    sortBy: 'newest',
    showReactions: true,
    showComments: true,
    minReactions: 0,
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [gamificationModalOpen, setGamificationModalOpen] = useState(false);
  
  // Новые состояния для аутентификации
  const [authStep, setAuthStep] = useState('welcome'); // 'welcome', 'login'
  const [loginData, setLoginData] = useState({
    email: 'test@example.com',
    password: 'test123',
  });
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Админская вкладка пользователей ---
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Функция для получения значения из куков
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Функция для загрузки данных из куков
  const loadCredentialsFromCookies = () => {
    const savedEmail = getCookie('test_email');
    const savedPassword = getCookie('test_password');
    
    if (savedEmail && savedPassword) {
      setLoginData({
        email: savedEmail,
        password: savedPassword,
      });
      return true; // Данные найдены
    }
    return false; // Данные не найдены
  };

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setProfile(settings.profile || profile);
      setTheme(settings.theme || 'light');
      setPrimaryColor(settings.primaryColor || '#1976d2');
      setNotifications(settings.notifications || notifications);
      setFilters(settings.filters || filters);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, [open]);

  // Автоматическое заполнение данными из куков при переходе на экран входа
  useEffect(() => {
    if (authStep === 'login') {
      const hasCredentials = loadCredentialsFromCookies();
      if (!hasCredentials) {
        // Если нет сохраненных данных, используем тестовые
        setLoginData({
          email: 'test@example.com',
          password: 'test123',
        });
      }
      
      // Тестируем подключение к API
      fetch('http://localhost:8000/api/health')
        .then(response => response.json())
        .then(data => {
          console.log('API Health Check:', data);
        })
        .catch(error => {
          console.error('API Health Check Failed:', error);
          setAuthError('Не удается подключиться к серверу. Убедитесь, что бэкенд запущен на порту 8000.');
        });
    }
  }, [authStep]);

  // Сохранение настроек в localStorage
  useEffect(() => {
    const settings = {
      profile,
      theme,
      primaryColor,
      notifications,
      filters,
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [profile, theme, primaryColor, notifications, filters]);

  // Функция для создания первого пользователя браузера
  const createFirstUser = async () => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const browserId = localStorage.getItem('browserId') || uuidv4();
      localStorage.setItem('browserId', browserId);
      
      const username = 'guest_' + browserId.slice(0, 8);
      const firstName = 'Гость';
      const lastName = browserId.slice(0, 4);
      
      const registerResponse = await authAPI.register({
        username: username,
        email: `guest_${browserId}@example.com`,
        password: Math.random().toString(36).slice(-8),
        first_name: firstName,
        last_name: lastName,
        bio: 'Гостевой пользователь'
      });
      
      const newUser = {
        id: registerResponse.user.id,
        name: `${registerResponse.user.first_name} ${registerResponse.user.last_name}`.trim(),
        email: registerResponse.user.email,
        username: registerResponse.user.username,
        avatar: '',
        browserId: browserId,
        createdAt: registerResponse.user.created_at,
        isFirstUser: true,
        authMethod: 'guest',
      };
      
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      if (onUserChange) onUserChange(newUser);
      
    } catch (error) {
      setAuthError('Ошибка создания гостевого пользователя: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка входа через социальную сеть
  const handleSocialLogin = async (networkId) => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      if (networkId === 'google') {
        // Проверяем, настроен ли Google OAuth
        const response = await fetch('http://localhost:8000/api/auth/google');
        if (response.status === 500 || response.status === 404) {
          setAuthError('Google OAuth не настроен. Следуйте инструкции в GOOGLE_OAUTH_SETUP.md');
          setIsLoading(false);
          return;
        }
        
        // Настоящий Google OAuth
        console.log('Запуск настоящего Google OAuth...');
        oauthAPI.initGoogleAuth();
        return; // Перенаправление произойдет автоматически
      }
      
      if (networkId === 'telegram') {
        // Настоящий Telegram OAuth
        console.log('Запуск настоящего Telegram OAuth...');
        try {
          // Получаем информацию о боте
          const botInfo = await telegramAPI.getBotInfo();
          
          // Инициализируем Telegram Login Widget
          telegramAPI.initTelegramWidget(botInfo.bot.username, async (telegramData) => {
            try {
              console.log('Telegram auth data:', telegramData);
              
              // Отправляем данные на сервер
              const response = await telegramAPI.login(telegramData);
              
              // Создаем пользователя
              const newUser = {
                id: response.user.id,
                name: `${response.user.first_name} ${response.user.last_name}`.trim(),
                email: response.user.email,
                username: response.user.username,
                avatar: response.user.avatar_url || '',
                telegramId: telegramData.id,
                createdAt: response.user.created_at,
                authMethod: 'telegram',
              };
              
              setCurrentUser(newUser);
              localStorage.setItem('currentUser', JSON.stringify(newUser));
              localStorage.setItem('authToken', response.token);
              if (onUserChange) onUserChange(newUser);
              
              console.log('Успешная авторизация через Telegram');
              
            } catch (error) {
              console.error('Telegram login error:', error);
              setAuthError(`Ошибка входа через Telegram: ${error.message}`);
            }
          });
          
        } catch (error) {
          console.error('Telegram bot info error:', error);
          setAuthError('Telegram Bot не настроен. Следуйте инструкции в TELEGRAM_OAUTH_SETUP.md');
        }
        return;
      }
      
      // Для других сетей пока оставляем симуляцию
      console.log(`Начинаем OAuth процесс для ${networkId}...`);
      
      // Шаг 1: Перенаправление на страницу авторизации
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Перенаправление на ${networkId}...`);
      
      // Шаг 2: Пользователь авторизуется (имитация)
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Пользователь авторизовался в ${networkId}`);
      
      // Шаг 3: Получение токена доступа
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Получен токен доступа от ${networkId}`);
      
      // Шаг 4: Получение данных пользователя из API
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Получены данные пользователя из ${networkId}`);
      
      // Получаем данные пользователя из социальной сети (имитация)
      const socialUserData = {
        facebook: { 
          name: 'Facebook Пользователь', 
          email: 'facebook@example.com',
          avatar: 'https://via.placeholder.com/150/4267B2/FFFFFF?text=F'
        },
        vk: { 
          name: 'VK Пользователь', 
          email: 'vk@example.com',
          avatar: 'https://via.placeholder.com/150/4C75A3/FFFFFF?text=V'
        },
        telegram: { 
          name: 'Telegram Пользователь', 
          email: 'telegram@example.com',
          avatar: 'https://via.placeholder.com/150/0088cc/FFFFFF?text=T'
        },
        github: { 
          name: 'GitHub Пользователь', 
          email: 'github@example.com',
          avatar: 'https://via.placeholder.com/150/333/FFFFFF?text=GH'
        },
        whatsapp: { 
          name: 'WhatsApp Пользователь', 
          email: 'whatsapp@example.com',
          avatar: 'https://via.placeholder.com/150/25D366/FFFFFF?text=W'
        },
      };
      
      const userData = socialUserData[networkId] || { 
        name: 'Пользователь', 
        email: '',
        avatar: ''
      };
      
      // Проверяем, есть ли уже пользователь с таким email
      const existingUser = localStorage.getItem('currentUser');
      if (existingUser) {
        const user = JSON.parse(existingUser);
        if (user.email === userData.email) {
          // Пользователь уже существует - входим
          console.log(`Пользователь ${userData.email} уже существует, выполняем вход`);
          setCurrentUser(user);
          if (onUserChange) onUserChange(user);
          setIsLoading(false);
          return;
        }
      }
      
      // Пользователь не найден - создаем нового через API
      console.log(`Создаем нового пользователя для ${networkId}`);
      
      const username = userData.email.split('@')[0] + '_' + networkId;
      const firstName = userData.name.split(' ')[0];
      const lastName = userData.name.split(' ').slice(1).join(' ') || '';
      
      const registerResponse = await authAPI.register({
        username: username,
        email: userData.email,
        password: Math.random().toString(36).slice(-8), // Генерируем случайный пароль
        first_name: firstName,
        last_name: lastName,
        bio: `Пользователь ${networkId}`
      });
      
      const newUser = {
        id: registerResponse.user.id,
        name: `${registerResponse.user.first_name} ${registerResponse.user.last_name}`.trim(),
        email: userData.email,
        username: registerResponse.user.username,
        avatar: userData.avatar,
        socialNetwork: networkId,
        createdAt: registerResponse.user.created_at,
        authMethod: 'oauth',
      };
      
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      if (onUserChange) onUserChange(newUser);
      
      console.log(`Успешная авторизация через ${networkId}`);
      
    } catch (error) {
      console.error(`Ошибка OAuth для ${networkId}:`, error);
      if (networkId === 'google') {
        setAuthError(`Google OAuth не настроен. Следуйте инструкции в GOOGLE_OAUTH_SETUP.md. Ошибка: ${error.message}`);
      } else {
        setAuthError(`Ошибка входа через ${SOCIAL_NETWORKS.find(n => n.id === networkId)?.name}. ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка входа по email
  const handleEmailLogin = async () => {
    if (!loginData.email) {
      setAuthError('Введите email');
      return;
    }
    
    if (!loginData.password) {
      setAuthError('Введите пароль');
      return;
    }
    
    setIsLoading(true);
    setAuthError('');
    
    try {
      console.log('Попытка входа с данными:', { email: loginData.email, password: '***' });
      
      // Пытаемся войти с существующим аккаунтом
      const loginResponse = await authAPI.login({
        username: loginData.email, // API принимает email как username
        password: loginData.password
      });
      
      console.log('Успешный ответ от сервера:', loginResponse);
      
      // Сохраняем токен
      if (loginResponse.token) {
        localStorage.setItem('authToken', loginResponse.token);
      }
      
      // Успешный вход
      const user = {
        id: loginResponse.user.id,
        name: `${loginResponse.user.first_name} ${loginResponse.user.last_name}`.trim(),
        email: loginData.email,
        username: loginResponse.user.username,
        avatar: loginResponse.user.avatar_url || '',
        createdAt: loginResponse.user.created_at,
        authMethod: 'email',
      };
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (onUserChange) onUserChange(user);
      
      // Сохраняем данные в куки для быстрого входа
      document.cookie = `test_email=${loginData.email}; path=/; max-age=${60*60*24*30}`; // 30 дней
      document.cookie = `test_password=${loginData.password}; path=/; max-age=${60*60*24*30}`; // 30 дней
      
      // Очищаем форму
      setLoginData({
        email: '',
        password: '',
      });
      
    } catch (error) {
      console.error('Детальная ошибка входа:', error);
      console.error('Тип ошибки:', typeof error);
      console.error('Сообщение ошибки:', error.message);
      console.error('Стек ошибки:', error.stack);
      
      // Если пользователь не найден, создаем новый
      if (error.message.includes('Неверные учетные данные')) {
        try {
          console.log('Создаем нового пользователя...');
          
          // Создаем нового пользователя
          const username = loginData.email.split('@')[0];
          const firstName = username.charAt(0).toUpperCase() + username.slice(1);
          
          const registerResponse = await authAPI.register({
            username: username,
            email: loginData.email,
            password: loginData.password,
            first_name: firstName,
            last_name: '',
            bio: ''
          });
          
          console.log('Успешная регистрация:', registerResponse);
          
          // Сохраняем токен
          if (registerResponse.token) {
            localStorage.setItem('authToken', registerResponse.token);
          }
          
          const newUser = {
            id: registerResponse.user.id,
            name: `${registerResponse.user.first_name} ${registerResponse.user.last_name}`.trim(),
            email: loginData.email,
            username: registerResponse.user.username,
            avatar: registerResponse.user.avatar_url || '',
            createdAt: registerResponse.user.created_at,
            authMethod: 'email',
          };
          
          setCurrentUser(newUser);
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          if (onUserChange) onUserChange(newUser);
          
          // Сохраняем данные в куки для быстрого входа
          document.cookie = `test_email=${loginData.email}; path=/; max-age=${60*60*24*30}`; // 30 дней
          document.cookie = `test_password=${loginData.password}; path=/; max-age=${60*60*24*30}`; // 30 дней
          
          // Очищаем форму
          setLoginData({
            email: '',
            password: '',
          });
          
        } catch (registerError) {
          console.error('Ошибка регистрации:', registerError);
          setAuthError(registerError.message || 'Ошибка создания аккаунта');
        }
      } else {
        setAuthError(error.message || 'Ошибка входа');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setPrimaryColor(THEMES[newTheme].primary);
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSectionFilterChange = (section) => {
    setFilters(prev => {
      const currentSections = prev.sections;
      if (section === 'all') {
        return { ...prev, sections: ['all'] };
      }
      
      const newSections = currentSections.includes('all') 
        ? [section]
        : currentSections.includes(section)
          ? currentSections.filter(s => s !== section)
          : [...currentSections, section];
      
      return { ...prev, sections: newSections.length === 0 ? ['all'] : newSections };
    });
  };

  const handleLogout = () => {
    setLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Очищаем токен и данные пользователя
    authAPI.logout();
    setCurrentUser(null);
    if (onUserChange) onUserChange(null);
    setLogoutConfirm(false);
    setAuthStep('welcome');
  };

  const cancelLogout = () => setLogoutConfirm(false);

  // --- Profile Edit ---
  const startEdit = () => {
    setEditName(currentUser?.name || profile.name);
    setEditEmail(currentUser?.email || profile.email);
    setEditMode(true);
  };
  const saveEdit = () => {
    const updatedUser = { 
      ...currentUser, 
      name: editName, 
      email: editEmail 
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Также обновляем профиль
    setProfile(prev => ({
      ...prev,
      name: editName,
      email: editEmail
    }));
    
    if (onUserChange) onUserChange(updatedUser);
    setEditMode(false);
  };
  const cancelEdit = () => setEditMode(false);

  // --- My Posts ---
  const myPosts = currentUser ? posts.filter(p => p.userId === currentUser.id) : [];

  // userStats для геймификации (пример)
  const userStats = {
    totalPosts: myPosts.length,
    totalReactions: myPosts.reduce((sum, p) => sum + (p.reactions ? Object.values(p.reactions).reduce((a, b) => a + b, 0) : 0), 0),
    totalComments: 0, // Можно добавить расчёт
    totalXP: 450, // TODO: рассчитать на основе достижений
    totalViews: 1234, // TODO: добавить просмотры
    soldItems: 2, // TODO: добавить продажи
  };

  // Рендер экрана приветствия
  const renderWelcomeScreen = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
        Добро пожаловать!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Войдите в систему или продолжите как гость
      </Typography>
      
      <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setAuthStep('login')}
          sx={{ py: 1.5 }}
        >
          Войти в систему
        </Button>
        <Button
          variant="text"
          size="large"
          onClick={createFirstUser}
          sx={{ py: 1.5 }}
        >
          Продолжить как гость
        </Button>
      </Stack>
    </Box>
  );

  // Рендер экрана входа
  const renderLoginScreen = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        Войти в систему
      </Typography>
      
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}
      
      <Stack spacing={3}>
        {/* Социальные сети */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Быстрый вход через:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            При первом входе будет создан новый аккаунт
          </Typography>
          <Grid container spacing={2}>
            {SOCIAL_NETWORKS.filter(n => n.id !== 'email').map((network) => (
              <Grid item xs={6} sm={4} key={network.id}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={network.icon}
                  onClick={() => handleSocialLogin(network.id)}
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderColor: network.color,
                    color: network.color,
                    '&:hover': {
                      borderColor: network.color,
                      bgcolor: `${network.color}10`,
                    },
                  }}
                >
                  {network.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        <Divider>
          <Typography variant="body2" color="text.secondary">или</Typography>
        </Divider>
        
        {/* Вход по email */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Вход по email:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            При первом входе будет создан новый аккаунт
          </Typography>
          
          {/* Кнопка для входа через браузер */}
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                // Генерируем уникальные данные для тестового пользователя
                const timestamp = Date.now();
                const uniqueEmail = `test_${timestamp}@example.com`;
                const uniqueUsername = `test_${timestamp}`;
                
                setLoginData({
                  email: uniqueEmail,
                  password: 'test123',
                });
                // Сохраняем в куки браузера
                document.cookie = `test_email=${uniqueEmail}; path=/; max-age=${60*60*24*30}`; // 30 дней
                document.cookie = `test_password=test123; path=/; max-age=${60*60*24*30}`; // 30 дней
                
                // Сразу выполняем вход
                try {
                  setIsLoading(true);
                  setAuthError('');
                  
                  console.log('Автоматический вход с тестовыми данными...');
                  
                  const loginResponse = await authAPI.login({
                    username: uniqueEmail,
                    password: 'test123'
                  });
                  
                  console.log('Успешный автоматический вход:', loginResponse);
                  
                  const user = {
                    id: loginResponse.user.id,
                    name: `${loginResponse.user.first_name} ${loginResponse.user.last_name}`.trim(),
                    email: uniqueEmail,
                    username: loginResponse.user.username,
                    avatar: loginResponse.user.avatar_url || '',
                    createdAt: loginResponse.user.created_at,
                    authMethod: 'email',
                  };
                  
                  setCurrentUser(user);
                  localStorage.setItem('currentUser', JSON.stringify(user));
                  if (onUserChange) onUserChange(user);
                  
                } catch (error) {
                  console.error('Ошибка автоматического входа:', error);
                  
                  // Если пользователь не найден, создаем нового
                  if (error.message.includes('Неверные учетные данные')) {
                    try {
                      console.log('Создаем нового тестового пользователя...');
                      
                      const registerResponse = await authAPI.register({
                        username: uniqueUsername,
                        email: uniqueEmail,
                        password: 'test123',
                        first_name: 'Тестовый',
                        last_name: 'Пользователь',
                        bio: 'Тестовый аккаунт'
                      });
                      
                      console.log('Успешная регистрация тестового пользователя:', registerResponse);
                      
                      const newUser = {
                        id: registerResponse.user.id,
                        name: `${registerResponse.user.first_name} ${registerResponse.user.last_name}`.trim(),
                        email: uniqueEmail,
                        username: registerResponse.user.username,
                        avatar: registerResponse.user.avatar_url || '',
                        createdAt: registerResponse.user.created_at,
                        authMethod: 'email',
                      };
                      
                      setCurrentUser(newUser);
                      localStorage.setItem('currentUser', JSON.stringify(newUser));
                      if (onUserChange) onUserChange(newUser);
                      
                    } catch (registerError) {
                      console.error('Ошибка создания тестового пользователя:', registerError);
                      setAuthError(`Ошибка создания тестового пользователя: ${registerError.message}`);
                    }
                  } else {
                    setAuthError(`Ошибка автоматического входа: ${error.message}`);
                  }
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              sx={{ mb: 1 }}
            >
              {isLoading ? 'Вход...' : 'Войти через браузер (запомнить)'}
            </Button>
            <Typography variant="caption" color="text.secondary" display="block">
              Сохранит данные в браузере для быстрого входа
            </Typography>
          </Box>
          
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
              placeholder="Введите ваш email"
            />
            <TextField
              label="Пароль"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              required
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleEmailLogin}
              disabled={isLoading || !loginData.email.trim() || !loginData.password.trim()}
              sx={{ py: 1.5 }}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </Stack>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => setAuthStep('welcome')}
          >
            Назад
          </Button>
        </Box>
      </Stack>
    </Box>
  );

  // Рендер профиля пользователя
  const renderProfileTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Профиль пользователя</Typography>
      
      <Stack spacing={3}>
        {/* Аватар */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={currentUser?.avatar || profile.avatar}
              sx={{ width: 80, height: 80, fontSize: 32 }}
            >
              {(currentUser?.name || profile.name)[0]}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <PhotoCameraIcon />
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </IconButton>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {currentUser?.name || profile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser?.email || profile.email}
            </Typography>
          </Box>
        </Box>

        {/* Кнопки редактирования */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {!editMode ? (
            <Button
              variant="outlined"
              onClick={startEdit}
              startIcon={<EditIcon />}
            >
              Редактировать
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={saveEdit}
                startIcon={<SaveIcon />}
              >
                Сохранить
              </Button>
              <Button
                variant="outlined"
                onClick={cancelEdit}
                startIcon={<CancelIcon />}
              >
                Отмена
              </Button>
            </>
          )}
        </Box>

        {/* Имя */}
        <TextField
          label="Имя"
          value={editMode ? editName : (currentUser?.name || profile.name)}
          onChange={(e) => editMode ? setEditName(e.target.value) : setProfile(prev => ({ ...prev, name: e.target.value }))}
          fullWidth
          disabled={!editMode}
        />

        {/* Email */}
        <TextField
          label="Email"
          type="email"
          value={editMode ? editEmail : (currentUser?.email || profile.email)}
          onChange={(e) => editMode ? setEditEmail(e.target.value) : setProfile(prev => ({ ...prev, email: e.target.value }))}
          fullWidth
          disabled={!editMode}
        />

        {/* Биография */}
        <TextField
          label="О себе"
          multiline
          rows={3}
          value={profile.bio}
          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          fullWidth
          disabled={!editMode}
        />
      </Stack>
    </Box>
  );

  // Рендер внешнего вида
  const renderThemeTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Внешний вид</Typography>
      
      <Stack spacing={3}>
        {/* Выбор темы */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Тема оформления</Typography>
          <Grid container spacing={2}>
            {Object.entries(THEMES).map(([key, themeData]) => (
              <Grid item xs={6} sm={4} key={key}>
                <Card
                  onClick={() => handleThemeChange(key)}
                  sx={{
                    cursor: 'pointer',
                    border: theme === key ? '2px solid' : '1px solid',
                    borderColor: theme === key ? 'primary.main' : 'divider',
                    bgcolor: theme === key ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ mb: 1, color: themeData.primary }}>
                      {themeData.icon}
                    </Box>
                    <Typography variant="body2">{themeData.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Основной цвет */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Основной цвет</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: primaryColor,
                border: '2px solid',
                borderColor: 'divider',
                cursor: 'pointer',
              }}
            />
            <Typography variant="body2">{primaryColor}</Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );

  // Рендер уведомлений
  const renderNotificationsTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Уведомления</Typography>
      
      <Stack spacing={2}>
        {NOTIFICATION_TYPES.map((type) => (
          <Box key={type.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2">{type.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {type.description}
              </Typography>
            </Box>
            <Switch
              checked={notifications[type.key]}
              onChange={() => handleNotificationChange(type.key)}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );

  // Рендер фильтров
  const renderFiltersTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Фильтры контента</Typography>
      
      <Stack spacing={3}>
        {/* Разделы */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Разделы</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {SECTIONS.map((section) => (
              <Chip
                key={section.value}
                label={section.label}
                onClick={() => handleSectionFilterChange(section.value)}
                color={filters.sections.includes(section.value) ? 'primary' : 'default'}
                variant={filters.sections.includes(section.value) ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Сортировка */}
        <FormControl fullWidth>
          <InputLabel>Сортировка</InputLabel>
          <Select
            value={filters.sortBy}
            label="Сортировка"
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <MenuItem value="newest">Сначала новые</MenuItem>
            <MenuItem value="oldest">Сначала старые</MenuItem>
            <MenuItem value="popular">По популярности</MenuItem>
            <MenuItem value="reactions">По реакциям</MenuItem>
          </Select>
        </FormControl>

        {/* Минимальное количество реакций */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Минимальное количество реакций: {filters.minReactions}
          </Typography>
          <Slider
            value={filters.minReactions}
            onChange={(e, value) => handleFilterChange('minReactions', value)}
            min={0}
            max={50}
            marks={[
              { value: 0, label: '0' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
          />
        </Box>

        {/* Дополнительные настройки */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Отображение</Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showReactions}
                  onChange={(e) => handleFilterChange('showReactions', e.target.checked)}
                />
              }
              label="Показывать реакции"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showComments}
                  onChange={(e) => handleFilterChange('showComments', e.target.checked)}
                />
              }
              label="Показывать комментарии"
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );

  // Рендер геймификации
  const renderGamificationTab = () => (
    <Gamification userStats={userStats} />
  );

  // --- Админская вкладка пользователей ---
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await authAPI.getUsers();
      console.log('Загруженные пользователи:', res);
      setUsers(Array.isArray(res) ? res : (res.users || []));
    } catch (e) {
      setDeleteError('Ошибка загрузки пользователей: ' + e.message);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setDeleteError('');
    try {
      await authAPI.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      setDeleteError('Ошибка удаления: ' + e.message);
    }
  };

  const handleChangeUserRole = async (id, newRole) => {
    setDeleteError('');
    try {
      await authAPI.updateUserRole(id, newRole);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (e) {
      setDeleteError('Ошибка смены роли: ' + e.message);
    }
  };

  useEffect(() => {
    if (tab === 4) fetchUsers();
  }, [tab]);

  const renderAdminUsersTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Пользователи в базе</Typography>
      {usersLoading ? <Typography>Загрузка...</Typography> : null}
      {deleteError && <Alert severity="error">{deleteError}</Alert>}
      <Stack spacing={2}>
        {(Array.isArray(users) ? users : []).map(user => (
          <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={user.avatar_url || ''}>{user.username?.[0]}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography>{user.username} ({user.email})</Typography>
              <Typography variant="caption" color="text.secondary">{user.first_name} {user.last_name}</Typography>
              <Typography variant="caption" color="text.secondary">Роль: {user.role}</Typography>
              <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
                <InputLabel>Роль</InputLabel>
                <Select
                  value={user.role || 'member'}
                  label="Роль"
                  onChange={e => handleChangeUserRole(user.id, e.target.value)}
                  disabled={user.id === currentUser?.id}
                >
                  <MenuItem value="member">member</MenuItem>
                  <MenuItem value="admin">admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button color="error" variant="outlined" onClick={() => handleDeleteUser(user.id)} disabled={user.id === currentUser?.id}>
              Удалить
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );

  // Рендер экрана аутентификации
  const renderAuthScreen = () => (
    <>
      {authStep === 'welcome' && renderWelcomeScreen()}
      {authStep === 'login' && renderLoginScreen()}
    </>
  );

  // Если пользователь не авторизован, показываем экран аутентификации
  if (!currentUser) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {authStep === 'welcome' && 'Добро пожаловать'}
          {authStep === 'login' && 'Войти в систему'}
          <Box>
            {authStep !== 'welcome' && (
              <IconButton onClick={() => setAuthStep('welcome')} size="small" sx={{ mr: 1 }}>
                <CloseIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {renderAuthScreen()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Настройки
        <Box>
          <Tooltip title="Открыть геймификацию в отдельном окне">
            <IconButton onClick={() => setGamificationModalOpen(true)} size="small" sx={{ ml: 1 }}>
              <EmojiEventsIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          maxHeight: { xs: '70vh', sm: '70vh', md: '70vh' },
          overflowY: 'auto',
          p: { xs: 1, sm: 2 },
        }}
      >
        {/* Информация о текущем пользователе */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 40, height: 40 }}>
                {currentUser.name[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {currentUser.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser.email || 'Email не указан'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
            >
              Выйти
            </Button>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Профиль" />
          <Tab label="Внешний вид" />
          <Tab label="Уведомления" />
          <Tab label="Фильтры" />
          <Tab label="Геймификация" />
          <Tab label="Пользователи" />
          {currentUser?.role === 'admin' && <Tab label="Администрирование" />}
        </Tabs>
        {tab === 0 && renderProfileTab()}
        {tab === 1 && renderThemeTab()}
        {tab === 2 && renderNotificationsTab()}
        {tab === 3 && renderFiltersTab()}
        {tab === 4 && renderGamificationTab()}
        {tab === 5 && renderAdminUsersTab()}
        {tab === 6 && currentUser?.role === 'admin' && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Администрирование</Typography>
            <Typography variant="body2">Здесь будут настройки для администраторов системы.</Typography>
          </Box>
        )}
      </DialogContent>
      
      {/* Диалог подтверждения выхода */}
      <Dialog open={logoutConfirm} onClose={cancelLogout}>
        <DialogTitle>Подтверждение выхода</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите выйти из системы?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelLogout}>Отмена</Button>
          <Button onClick={confirmLogout} color="error" variant="contained">
            Выйти
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно геймификации */}
      <Gamification open={gamificationModalOpen} onClose={() => setGamificationModalOpen(false)} userStats={userStats} />
    </Dialog>
  );
};

export default UserSettings; 