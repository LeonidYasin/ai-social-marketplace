import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useMediaQuery,
  useTheme,
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
  Logout as LogoutIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import DialogContentText from '@mui/material/DialogContentText';
import PostCard from './PostCard';
import Gamification from './Gamification';
import { authAPI, oauthAPI, telegramAPI } from '../services/api';
import API_CONFIG from '../config/api';

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

const UserSettings = ({ open, onClose, onUserChange, posts = [], currentUser, setCurrentUser, isPageMode = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState({
    name: 'Александр',
    email: 'alex@example.com',
    bio: 'Люблю технологии и новые знакомства',
    avatar: null,
  });
  const [themeName, setThemeName] = useState('light');
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

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  // Новые состояния для аутентификации
  const [authStep, setAuthStep] = useState('welcome'); // 'welcome', 'choose-method', 'login'
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

  // Новые состояния для получения роли admin
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Смена admin-пароля
  const [changePwd, setChangePwd] = useState({ old: '', new1: '', new2: '' });
  const [changePwdMsg, setChangePwdMsg] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  const navigate = useNavigate();

  // Сброс состояния авторизации при изменении пользователя
  useEffect(() => {
    if (currentUser) {
      setAuthStep('welcome');
      setAuthError('');
      setIsLoading(false);
    }
  }, [currentUser]);

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
      setThemeName(settings.theme || 'light');
      setPrimaryColor(settings.primaryColor || '#1976d2');
      setNotifications(settings.notifications || notifications);
      setFilters(settings.filters || filters);
    }
  }, []);



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
              fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.HEALTH))
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
      themeName,
      primaryColor,
      notifications,
      filters,
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [profile, themeName, primaryColor, notifications, filters]);

  // Функция для создания первого пользователя браузера
  const createFirstUser = async () => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const browserId = localStorage.getItem('browserId') || uuidv4();
      localStorage.setItem('browserId', browserId);
      
      // Проверяем, есть ли уже сохраненный гостевой пользователь
      const savedGuestUser = localStorage.getItem('guestUser');
      if (savedGuestUser) {
        try {
          const guestUser = JSON.parse(savedGuestUser);
          console.log('Найден сохраненный гостевой пользователь:', guestUser.username);
          
          // Пытаемся войти с сохраненными данными
          const loginResponse = await authAPI.login({
            username: guestUser.username,
            password: guestUser.password
          });
          
          const newUser = {
            id: loginResponse.user.id,
            name: `${loginResponse.user.first_name} ${loginResponse.user.last_name}`.trim(),
            email: loginResponse.user.email,
            username: loginResponse.user.username,
            avatar: '',
            browserId: browserId,
            createdAt: loginResponse.user.created_at,
            isFirstUser: true,
            authMethod: 'guest',
          };
          
          setCurrentUser(newUser);
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          localStorage.setItem('authToken', loginResponse.token);
          if (onUserChange) onUserChange(newUser);
          
          // Перенаправляем на главную страницу в режиме страницы
          if (isPageMode) {
            console.log('Перенаправляем на главную страницу после входа как гость');
            navigate('/');
          } else {
            onClose();
          }
          return;
        } catch (error) {
          console.log('Не удалось войти с сохраненными данными, создаем нового гостя');
        }
      }
      
      // Создаем нового гостевого пользователя
      const uniqueSuffix = Math.random().toString(36).slice(-6);
      const username = `guest_${browserId.slice(0, 8)}_${uniqueSuffix}`;
      const firstName = 'Гость';
      const lastName = browserId.slice(0, 4);
      const email = `guest_${browserId}_${uniqueSuffix}@example.com`;
      const password = Math.random().toString(36).slice(-8);
      
      const registerResponse = await authAPI.register({
        username: username,
        email: email,
        password: password,
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
      localStorage.setItem('authToken', registerResponse.token);
      
      // Сохраняем данные гостевого пользователя для повторного использования
      localStorage.setItem('guestUser', JSON.stringify({
        username: username,
        password: password,
        email: email
      }));
      
      if (onUserChange) onUserChange(newUser);
      
      // Перенаправляем на главную страницу в режиме страницы
      if (isPageMode) {
        console.log('Перенаправляем на главную страницу после входа как гость');
        navigate('/');
      } else {
        onClose();
      }
      
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
        const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH_GOOGLE));
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
          avatar: '/api/placeholder/150/4267B2/FFFFFF/F'
        },
        vk: { 
          name: 'VK Пользователь', 
          email: 'vk@example.com',
          avatar: '/api/placeholder/150/4C75A3/FFFFFF/V'
        },
        telegram: { 
          name: 'Telegram Пользователь', 
          email: 'telegram@example.com',
          avatar: '/api/placeholder/150/0088cc/FFFFFF/T'
        },
        github: { 
          name: 'GitHub Пользователь', 
          email: 'github@example.com',
          avatar: '/api/placeholder/150/333/FFFFFF/GH'
        },
        whatsapp: { 
          name: 'WhatsApp Пользователь', 
          email: 'whatsapp@example.com',
          avatar: '/api/placeholder/150/25D366/FFFFFF/W'
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
    // Валидация полей
    if (!loginData.email || loginData.email.trim() === '') {
      setAuthError('Введите email');
      return;
    }
    
    if (!loginData.password || loginData.password.trim() === '') {
      setAuthError('Введите пароль');
      return;
    }
    
    // Проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email.trim())) {
      setAuthError('Введите корректный email');
      return;
    }
    
    // Проверка длины пароля
    if (loginData.password.length < 3) {
      setAuthError('Пароль должен содержать минимум 3 символа');
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
      
      // Закрываем диалог после успешного входа
      onClose();
      
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
          
          // Закрываем диалог после успешной регистрации
          onClose();
          
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
    setThemeName(newTheme);
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
          onClick={() => setAuthStep('choose-method')}
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

  // Рендер экрана выбора способа входа
  const renderChooseMethodScreen = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Выберите способ входа
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Войдите через социальную сеть или используйте email
          </Typography>
      
      <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
            {SOCIAL_NETWORKS.filter(n => n.id !== 'email').map((network) => (
                <Button
            key={network.id}
                  variant="outlined"
            size="large"
                  onClick={() => handleSocialLogin(network.id)}
            startIcon={network.icon}
                  sx={{
                    py: 1.5,
                    borderColor: network.color,
                    color: network.color,
                    '&:hover': {
                      borderColor: network.color,
                backgroundColor: `${network.color}10`
              }
                  }}
                >
                  {network.name}
                </Button>
        ))}
        
            <Button
          variant="contained"
          size="large"
          onClick={() => setAuthStep('login')}
          startIcon={<EmailIcon />}
          sx={{ py: 1.5, mt: 2 }}
        >
          Email
        </Button>
        
        <Button
          variant="text"
          size="large"
          onClick={() => setAuthStep('welcome')}
          sx={{ py: 1.5, mt: 1 }}
        >
          Назад
            </Button>
      </Stack>
          </Box>
  );

  // Рендер экрана входа
  const renderLoginScreen = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
        Вход в систему
      </Typography>
      
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}
      
      <Box component="form" onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }}>
            <TextField
          fullWidth
              label="Email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
          sx={{ mb: 2 }}
          data-testid="email-input"
            />
            <TextField
          fullWidth
              label="Пароль"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
          sx={{ mb: 3 }}
          data-testid="password-input"
            />
            <Button
              fullWidth
          variant="contained"
          type="submit"
          disabled={isLoading}
          sx={{ mb: 2 }}
          data-testid="submit-button"
        >
          {isLoading ? <CircularProgress size={24} /> : 'Войти'}
            </Button>
        </Box>
        
          <Button
        fullWidth
        variant="outlined"
            onClick={() => setAuthStep('welcome')}
        sx={{ mb: 2 }}
          >
            Назад
          </Button>
    </Box>
  );

  // Рендер профиля пользователя
  const renderProfileTab = () => (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Профиль пользователя</Typography>
      
      <Stack spacing={{ xs: 2, sm: 3 }}>
        {/* Аватар */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={currentUser?.avatar || profile.avatar}
              sx={{ width: { xs: 60, sm: 80 }, height: { xs: 60, sm: 80 }, fontSize: { xs: 24, sm: 32 } }}
            >
              {(currentUser?.name || profile.name)[0]}
            </Avatar>
            <IconButton
              component="label"
              size={isMobile ? "small" : "medium"}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <PhotoCameraIcon fontSize={isMobile ? "small" : "medium"} />
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </IconButton>
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {currentUser?.name || profile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {currentUser?.email || profile.email}
            </Typography>
          </Box>
        </Box>

        {/* Кнопки редактирования */}
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {!editMode ? (
            <Button
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              onClick={startEdit}
              startIcon={<EditIcon />}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Редактировать
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                size={isMobile ? "small" : "medium"}
                onClick={saveEdit}
                startIcon={<SaveIcon />}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Сохранить
              </Button>
              <Button
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                onClick={cancelEdit}
                startIcon={<CancelIcon />}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
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
          size={isMobile ? "small" : "medium"}
        />

        {/* Email */}
        <TextField
          label="Email"
          type="email"
          value={editMode ? editEmail : (currentUser?.email || profile.email)}
          onChange={(e) => editMode ? setEditEmail(e.target.value) : setProfile(prev => ({ ...prev, email: e.target.value }))}
          fullWidth
          disabled={!editMode}
          size={isMobile ? "small" : "medium"}
        />

        {/* Биография */}
        <TextField
          label="О себе"
          multiline
          rows={isMobile ? 2 : 3}
          value={profile.bio}
          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          fullWidth
          disabled={!editMode}
          size={isMobile ? "small" : "medium"}
        />
      </Stack>
    </Box>
  );

  // Рендер внешнего вида
  const renderThemeTab = () => (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Внешний вид</Typography>
      
      <Stack spacing={{ xs: 2, sm: 3 }}>
        {/* Выбор темы */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Тема оформления</Typography>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {Object.entries(THEMES).map(([key, themeData]) => (
              <Grid item xs={6} sm={4} key={key}>
                <Card
                  onClick={() => handleThemeChange(key)}
                  sx={{
                    cursor: 'pointer',
                    border: themeName === key ? '2px solid' : '1px solid',
                    borderColor: themeName === key ? 'primary.main' : 'divider',
                    bgcolor: themeName === key ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2 } }}>
                    <Box sx={{ mb: 1, color: themeData.primary }}>
                      {React.cloneElement(themeData.icon, { fontSize: isMobile ? "small" : "medium" })}
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>{themeData.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Основной цвет */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Основной цвет</Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
            <Box
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: '50%',
                bgcolor: primaryColor,
                border: '2px solid',
                borderColor: 'divider',
                cursor: 'pointer',
              }}
            />
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{primaryColor}</Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );

  // Рендер уведомлений
  const renderNotificationsTab = () => (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Уведомления</Typography>
      
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        {NOTIFICATION_TYPES.map((type) => (
          <Box key={type.key} sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: { xs: 1, sm: 2 }
          }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{type.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                {type.description}
              </Typography>
            </Box>
            <Switch
              checked={notifications[type.key]}
              onChange={() => handleNotificationChange(type.key)}
              size={isMobile ? "small" : "medium"}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );

  // Рендер фильтров
  const renderFiltersTab = () => (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Фильтры контента</Typography>
      
      <Stack spacing={{ xs: 2, sm: 3 }}>
        {/* Разделы */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Разделы</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 } }}>
            {SECTIONS.map((section) => (
              <Chip
                key={section.value}
                label={section.label}
                onClick={() => handleSectionFilterChange(section.value)}
                color={filters.sections.includes(section.value) ? 'primary' : 'default'}
                variant={filters.sections.includes(section.value) ? 'filled' : 'outlined'}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  cursor: 'pointer',
                  fontSize: { xs: '0.7rem', sm: '0.875rem' }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Сортировка */}
        <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
          <Typography variant="subtitle1" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
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
            size={isMobile ? "small" : "medium"}
          />
        </Box>

        {/* Дополнительные настройки */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Отображение</Typography>
          <Stack spacing={{ xs: 0.5, sm: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showReactions}
                  onChange={(e) => handleFilterChange('showReactions', e.target.checked)}
                  size={isMobile ? "small" : "medium"}
                />
              }
              label={<Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Показывать реакции</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showComments}
                  onChange={(e) => handleFilterChange('showComments', e.target.checked)}
                  size={isMobile ? "small" : "medium"}
                />
              }
              label={<Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Показывать комментарии</Typography>}
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );

  // Рендер геймификации
  const renderGamificationTab = () => (
    <Gamification userStats={userStats} isPageMode={true} />
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
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Пользователи в базе</Typography>
      {usersLoading ? <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Загрузка...</Typography> : null}
      {deleteError && <Alert severity="error" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{deleteError}</Alert>}
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        {(Array.isArray(users) ? users : []).map(user => (
          <Box key={user.id} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap',
            p: { xs: 1, sm: 2 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}>
            <Avatar src={user.avatar_url || ''} sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
              {user.username?.[0]}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                {user.username} ({user.email})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Роль: {user.role}
              </Typography>
              <FormControl size="small" sx={{ minWidth: { xs: 80, sm: 120 }, ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}>
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
            <Button 
              color="error" 
              variant="outlined" 
              size={isMobile ? "small" : "medium"}
              onClick={() => handleDeleteUser(user.id)} 
              disabled={user.id === currentUser?.id}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            >
              Удалить
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );

  // Получение роли администратора
  const renderGetAdminRole = () => (
    <Box sx={{ 
      mt: { xs: 1, sm: 2 }, 
      mb: { xs: 1, sm: 2 }, 
      p: { xs: 1, sm: 2 }, 
      bgcolor: '#e6f7ff', 
      borderRadius: 2, 
      border: '1px solid #91d5ff',
      width: '100%',
      maxWidth: '100%',
      overflow: 'auto'
    }}>
      <Typography variant="h6" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        Получить роль администратора
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 2 }, 
        alignItems: 'center', 
        flexWrap: 'wrap',
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <TextField
          type="password"
          label="Пароль администратора"
          value={changePwd.old}
          onChange={e => setChangePwd({ ...changePwd, old: e.target.value })}
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          placeholder="Введите пароль администратора"
        />
        <Button
          variant="contained"
          color="primary"
          size={isMobile ? "small" : "medium"}
          disabled={changePwdLoading || !changePwd.old}
          onClick={async () => {
            setChangePwdLoading(true);
            setChangePwdMsg('');
            try {
              const res = await fetch('/api/admin/verify-admin-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ password: changePwd.old })
              });
              const data = await res.json();
              if (res.ok) {
                setChangePwd({ old: '', new1: '', new2: '' });
                setChangePwdMsg('Роль администратора получена!');
                // Обновляем роль пользователя
                if (setCurrentUser && currentUser) {
                  setCurrentUser({ ...currentUser, role: 'admin' });
                }
                // Перезагружаем страницу через секунду
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              } else {
                setChangePwdMsg(data.error || data.message || 'Неверный пароль администратора');
              }
            } catch (e) {
              setChangePwdMsg('Ошибка запроса: ' + e.message);
            } finally {
              setChangePwdLoading(false);
            }
          }}
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {changePwdLoading ? 'Проверка...' : 'Получить роль администратора'}
        </Button>
      </Box>
      {changePwdMsg && (
        <Typography 
          color={changePwdMsg.includes('успешно') ? 'primary' : 'error'} 
          sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {changePwdMsg}
        </Typography>
      )}
    </Box>
  );

  // Вкладка администрирования
  const renderAdminTab = () => (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Администрирование</Typography>
      <Typography variant="body2" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
        Здесь доступны функции для администраторов системы.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AdminPanelSettingsIcon />}
        sx={{ mb: 2 }}
        onClick={() => navigate('/admin')}
      >
        Открыть админ-панель
      </Button>
      {/* Форма смены пароля администратора для уже админов */}
      <Box sx={{ 
        mt: { xs: 1, sm: 2 }, 
        mb: { xs: 1, sm: 2 }, 
        p: { xs: 1, sm: 2 }, 
        bgcolor: '#fff3e0', 
        borderRadius: 2, 
        border: '1px solid #ffb74d',
        width: '100%',
        maxWidth: '100%',
        overflow: 'auto'
      }}>
        <Typography variant="h6" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Сменить пароль администратора
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <TextField
            type="password"
            label="Старый пароль"
            value={changePwd.new1}
            onChange={e => setChangePwd({ ...changePwd, new1: e.target.value })}
            size={isMobile ? "small" : "medium"}
            fullWidth={isMobile}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          />
          <TextField
            type="password"
            label="Новый пароль"
            value={changePwd.new2}
            onChange={e => setChangePwd({ ...changePwd, new2: e.target.value })}
            size={isMobile ? "small" : "medium"}
            fullWidth={isMobile}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          />
          <Button
            variant="contained"
            color="warning"
            size={isMobile ? "small" : "medium"}
            disabled={changePwdLoading || !changePwd.new1 || !changePwd.new2 || changePwd.new1 !== changePwd.new2}
            onClick={async () => {
              setChangePwdLoading(true);
              setChangePwdMsg('');
              try {
                const res = await fetch('/api/admin/change-admin-password', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                  },
                  body: JSON.stringify({ oldPassword: changePwd.new1, newPassword: changePwd.new2 })
                });
                const data = await res.json();
                if (res.ok) {
                  setChangePwd({ old: '', new1: '', new2: '' });
                  setChangePwdMsg('Пароль успешно изменён!');
                } else {
                  setChangePwdMsg(data.error || data.message || 'Ошибка');
                }
              } catch (e) {
                setChangePwdMsg('Ошибка запроса: ' + e.message);
              } finally {
                setChangePwdLoading(false);
              }
            }}
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {changePwdLoading ? 'Смена...' : 'Сменить пароль'}
          </Button>
        </Box>
        {changePwdMsg && (
          <Typography 
            color={changePwdMsg.includes('успешно') ? 'primary' : 'error'} 
            sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {changePwdMsg}
          </Typography>
        )}
      </Box>
      {/* Здесь могут быть другие админские функции */}
    </Box>
  );

  // Рендер экрана аутентификации
  const renderAuthScreen = () => (
    <>
      {authStep === 'welcome' && renderWelcomeScreen()}
      {authStep === 'choose-method' && renderChooseMethodScreen()}
      {authStep === 'login' && renderLoginScreen()}
    </>
  );

  // Если пользователь не авторизован, показываем экран аутентификации
  if (!currentUser) {
    if (isPageMode) {
      return (
        <Box sx={{ 
          p: { xs: 1, sm: 2, md: 3 },
          maxWidth: '100%',
          overflow: 'auto'
        }}>
          {/* Кнопка выхода для режима страницы */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Выйти
            </Button>
          </Box>
          
          {renderAuthScreen()}
        </Box>
      );
    }
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {authStep === 'welcome' && 'Добро пожаловать'}
          {authStep === 'choose-method' && 'Выберите способ входа'}
          {authStep === 'login' && 'Войти в систему'}
          <Box>
            {authStep !== 'welcome' && authStep !== 'choose-method' && (
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

  const renderContent = () => (
    <>
      {!isPageMode && (
        <Box sx={{ mb: 2, p: { xs: 1, sm: 2 }, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minWidth: 0, flex: 1 }}>
              <Avatar sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                {currentUser.name[0]}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {currentUser.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {currentUser.email || 'Email не указан'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size={isMobile ? "small" : "medium"}
              onClick={handleLogout}
              sx={{ flexShrink: 0 }}
            >
              Выйти
            </Button>
          </Box>
        </Box>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ 
          mb: 2,
          '& .MuiTabs-flexContainer': {
            flexWrap: 'wrap !important',
            gap: '4px !important'
          },
          '& .MuiTab-root': {
            minWidth: 'auto !important',
            flex: '0 0 auto !important'
          }
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile={true}
      >
        <Tab label="Профиль" />
        <Tab label="Внешний вид" />
        <Tab label="Уведомления" />
        <Tab label="Фильтры" />
        <Tab label="Геймификация" />
        <Tab label="Пользователи" />
        {currentUser?.role === 'admin' && <Tab label="Администрирование" />}
      </Tabs>
      <Box sx={{ 
        p: { xs: 0.5, sm: 2 },
        width: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        '& *': {
          maxWidth: '100% !important'
        },
        '& .MuiFormControl-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiTextField-root': {
          width: '100%'
        },
        '& .MuiSelect-root': {
          width: '100%'
        },
        '& .MuiButton-root': {
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        },
        '& .MuiGrid-root': {
          width: '100%'
        },
        '& .MuiCard-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiPaper-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiStack-root': {
          width: '100%'
        },
        '& .MuiTabs-root': {
          width: '100%'
        },
        '& .MuiTab-root': {
          minWidth: 'auto !important'
        }
      }}>
        {tab === 0 && renderProfileTab()}
        {tab === 1 && renderThemeTab()}
        {tab === 2 && renderNotificationsTab()}
        {tab === 3 && renderFiltersTab()}
        {tab === 4 && renderGamificationTab()}
        {tab === 5 && renderAdminUsersTab()}
        {tab === 6 && currentUser?.role === 'admin' && renderAdminTab()}
        {/* Если не админ — показать форму стать админом */}
        {currentUser?.role !== 'admin' && renderGetAdminRole()}
      </Box>
    </>
  );

  // Рендерим содержимое в зависимости от режима
  if (isPageMode) {
    return (
      <Box sx={{ 
        width: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        p: { xs: 1, sm: 2 },
        '& *': {
          maxWidth: '100% !important'
        },
        '& .MuiBox-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiPaper-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiCard-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiGrid-root': {
          width: '100%'
        },
        '& .MuiFormControl-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiTextField-root': {
          width: '100%'
        },
        '& .MuiSelect-root': {
          width: '100%'
        },
        '& .MuiStack-root': {
          width: '100%'
        },
        '& .MuiTabs-root': {
          width: '100%'
        },
        '& .MuiTab-root': {
          minWidth: 'auto !important',
          flex: '0 0 auto !important'
        },
        '& .MuiTabs-flexContainer': {
          flexWrap: 'wrap !important',
          gap: '4px !important'
        }
      }}>
        {/* Крестик для закрытия панели */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={() => navigate('/')} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
        {renderContent()}
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
      </Box>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      data-testid="user-settings-dialog"
    >
      <DialogContent>
        {renderContent()}
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
    </Dialog>
  );
};

export default UserSettings; 