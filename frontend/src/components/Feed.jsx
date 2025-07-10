import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, CardMedia, Grid, Avatar, IconButton, Stack, Tabs, Tab, Divider, Tooltip, ToggleButtonGroup, ToggleButton, Popover, Chip, useTheme, useMediaQuery, Fab, InputBase, CircularProgress, Alert } from '@mui/material';
import BackendStatus from './BackendStatus';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import UserSettings from './UserSettings';
import PostCard from './PostCard';
import { postsAPI } from '../services/api';
import backendManager from '../services/backendManager';
import { useNavigate, useOutletContext } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import ErrorDisplay from './ErrorDisplay';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ErrorIcon from '@mui/icons-material/Error';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const initialPosts = [
  { id: 1, text: 'Продаю iPhone 13', images: [], video: null, doc: null, bg: '', section: 'sell', privacy: 'all', reactions: { like: 3, love: 2, laugh: 1, wow: 0, sad: 0, angry: 0 } },
  { id: 2, text: 'MacBook Air, почти новый', images: [], video: null, doc: null, bg: '', section: 'sell', privacy: 'all', reactions: { like: 2, love: 1, laugh: 0, wow: 1, sad: 0, angry: 0 } },
];

const initialAIMessages = [
  { text: 'Здравствуйте! Я ваш AI-ассистент. Могу помочь с созданием постов, поиском товаров, советами по продажам и многим другим. Что вас интересует?', isUser: false },
];

const SECTIONS = [
  { value: 'tribune', label: 'Трибуна' },
  { value: 'video', label: 'Видео' },
  { value: 'sell', label: 'Продам' },
  { value: 'buy', label: 'Куплю' },
  { value: 'give', label: 'Отдам' },
  { value: 'realty', label: 'Недвижимость' },
];

const BG_COLORS = [
  '',
  'linear-gradient(90deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(90deg, #f9d423 0%, #ff4e50 100%)',
  'linear-gradient(90deg, #43cea2 0%, #185a9d 100%)',
  'linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)',
  '#fffde4',
  '#f0f2f5',
];

// Реакции эмодзи
const REACTIONS = {
  like: { icon: '👍', label: 'Нравится', color: '#1877f2' },
  love: { icon: '❤️', label: 'Любовь', color: '#ed5167' },
  laugh: { icon: '😂', label: 'Смех', color: '#ffd96a' },
  wow: { icon: '😮', label: 'Вау', color: '#ffd96a' },
  sad: { icon: '😢', label: 'Грусть', color: '#ffd96a' },
  angry: { icon: '😠', label: 'Злость', color: '#f02849' },
};

// Компонент для комментариев с ветками
const Comment = ({ comment, onReply, onSendReply, replyValue, setReplyValue, depth = 0, onLikeComment }) => {
  const [showReply, setShowReply] = useState(false);
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1, ml: depth * 4 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: comment.isAI ? 'primary.main' : 'grey.400', fontSize: 16, mr: 1 }}>
        {comment.isAI ? <SmartToyIcon fontSize="small" /> : (comment.author[0] || '?')}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ bgcolor: theme => theme.palette.background.default, borderRadius: 2, px: 2, py: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 14 }}>{comment.author}</Typography>
          <Typography variant="body2" sx={{ fontSize: 15 }}>{comment.text}</Typography>
          <Typography variant="caption" color="text.secondary">{comment.time}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button size="small" sx={{ textTransform: 'none', fontSize: 13, minWidth: 0, p: 0, color: 'primary.main' }} onClick={() => setShowReply(!showReply)}>
            Ответить
          </Button>
          <Button 
            size="small" 
            sx={{ 
              textTransform: 'none', 
              fontSize: 13, 
              minWidth: 0, 
              p: 0, 
              color: comment.liked ? 'primary.main' : 'text.secondary',
              fontWeight: comment.liked ? 600 : 400,
              transition: 'all 0.2s ease-in-out',
              '&:hover': { 
                transform: 'scale(1.05)',
                color: 'primary.main',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }} 
            onClick={() => onLikeComment(comment.id)}
          >
            <ThumbUpIcon 
              fontSize="small" 
              sx={{ 
                mr: 0.5, 
                fontSize: 16,
                transition: 'all 0.2s',
                transform: comment.liked ? 'scale(1.2)' : 'scale(1)',
                color: comment.liked ? 'primary.main' : 'inherit',
                animation: comment.liked ? 'commentLike 0.3s ease-in-out' : 'none',
                '@keyframes commentLike': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.5)' },
                  '100%': { transform: 'scale(1.2)' },
                }
              }} 
            />
            {comment.likes || 0}
          </Button>
        </Stack>
        {showReply && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Ваш ответ..."
              value={replyValue}
              onChange={e => setReplyValue(e.target.value)}
              sx={{ bgcolor: theme => theme.palette.background.paper, borderRadius: 2, mr: 1 }}
            />
            <Button variant="contained" size="small" onClick={onSendReply} disabled={!replyValue}>Отправить</Button>
          </Box>
        )}
        {/* Вложенные комментарии */}
        {comment.replies && comment.replies.map((reply, i) => (
          <Comment
            key={i}
            comment={reply}
            onReply={() => onReply(comment.id, reply.id)}
            onSendReply={() => onSendReply(comment.id, reply.id)}
            replyValue={replyValue}
            setReplyValue={setReplyValue}
            depth={depth + 1}
            onLikeComment={onLikeComment}
          />
        ))}
      </Box>
    </Box>
  );
};

const Feed = ({ onDataUpdate, currentUser, leftSidebarOpen, setLeftSidebarOpen, rightSidebarOpen, setRightSidebarOpen, aiChatOpen, setAiChatOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { showPresentation, onHidePresentation } = useOutletContext();
  
  // Автоматически закрываем сайдбары при переходе на мобильный размер
  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  }, [isMobile, setLeftSidebarOpen, setRightSidebarOpen]);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [doc, setDoc] = useState(null);
  const [privacy, setPrivacy] = useState('all');
  const [section, setSection] = useState('tribune');
  const [bg, setBg] = useState('');
  const [open, setOpen] = useState(false);
  const [aiOpen, setAIOpen] = useState(false);
  const [aiMessages, setAIMessages] = useState(initialAIMessages);
  const [aiInput, setAIInput] = useState('');
  // Комментарии хранятся в состоянии по id поста
  const [comments, setComments] = useState({}); // { [postId]: [ {id, author, text, time, replies: [], likes: 0, liked: false} ] }
  const [commentValue, setCommentValue] = useState({}); // { [postId]: '' }
  const [replyValue, setReplyValue] = useState('');
  // Реакции пользователя на посты
  const [userReactions, setUserReactions] = useState({}); // { [postId]: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | null }
  // Анимации реакций
  const [reactionAnimations, setReactionAnimations] = useState({}); // { [postId]: { reaction: string, active: boolean } }
  // Состояние загрузки реакций
  const [reactionLoading, setReactionLoading] = useState({}); // { [postId]: boolean }
  // Поповер для выбора реакций
  const [reactionAnchor, setReactionAnchor] = useState({}); // { [postId]: HTMLElement | null }
  // Реальное время
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  // Уведомления
  const [notifications, setNotifications] = useState([]);
  // Состояние лампочки статуса
  const [statusLight, setStatusLight] = useState({ 
    color: '#4caf50', 
    intensity: 0.6, 
    isFlashing: false 
  });
  // Развернута ли лента событий
  const [showAllEvents, setShowAllEvents] = useState(false);
  // Статус бэкенда
  const [backendStatus, setBackendStatus] = useState({ isRunning: true });
  // Предыдущий статус бэкенда для отслеживания изменений
  const previousBackendStatus = useRef({ isRunning: true });
  // Настройки пользователя

  const [userSettings, setUserSettings] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Состояния для формы создания поста
  const [loadingPost, setLoadingPost] = useState(false);
  const [errorPost, setErrorPost] = useState('');

  const postInputRef = useRef(null);

  const failedPostFetchAttempts = useRef(0);
  const MAX_POST_FETCH_ATTEMPTS = 3;
  const shownConnectionErrorRef = useRef(false);

  // Загрузка постов с backend
  const loadPosts = async () => {
    if (failedPostFetchAttempts.current >= MAX_POST_FETCH_ATTEMPTS) {
      setLoading(false);
      return;
    }
    try {
      console.log('loadPosts: Starting to load posts');
      setLoading(true);
      setError(null);
      console.log('loadPosts: Calling postsAPI.getPosts()');
      const response = await postsAPI.getPosts();
      console.log('loadPosts: Received response:', response);
      const backendPosts = response.posts.map(post => ({
        id: post.id,
        text: post.content,
        images: post.media_urls ? post.media_urls.map(url => 
          url.startsWith('blob:') ? url : 
          url.startsWith('http') ? url : 
          getPlaceholderImage(url)
        ) : [],
        video: null,
        doc: null,
        bg: post.background_color || '',
        section: post.section || 'general',
        privacy: post.privacy || 'public',
        reactions: post.reactions.reduce((acc, reaction) => {
          acc[reaction.reaction_type] = parseInt(reaction.count);
          return acc;
        }, { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, angry: 0 }),
        user: {
          id: post.user_id,
          name: `${post.first_name} ${post.last_name}`,
          avatar: post.avatar_url,
          username: post.username
        },
        createdAt: post.created_at,
        commentCount: parseInt(post.comment_count) || 0,
        reactionCount: parseInt(post.reaction_count) || 0
      }));
      console.log('loadPosts: Mapped posts:', backendPosts);
      setPosts(backendPosts);
      failedPostFetchAttempts.current = 0;
      shownConnectionErrorRef.current = false;
    } catch (err) {
      console.error('Ошибка загрузки постов:', err);
      
      // Умная обработка ошибок
      let errorMessage = 'Не удалось загрузить посты';
      let showFallback = true;
      
      if (err?.message) {
        if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Сервер недоступен. Показываем локальные данные.';
          showFallback = true;
        } else if (err.message.includes('401')) {
          errorMessage = 'Необходима авторизация для загрузки постов.';
          showFallback = false;
        } else if (err.message.includes('500')) {
          errorMessage = 'Ошибка сервера. Показываем локальные данные.';
          showFallback = true;
        } else {
          errorMessage = `Ошибка: ${err.message}`;
          showFallback = true;
        }
      }
      
      setError(errorMessage);
      failedPostFetchAttempts.current++;
      if (failedPostFetchAttempts.current === MAX_POST_FETCH_ATTEMPTS && !shownConnectionErrorRef.current) {
        shownConnectionErrorRef.current = true;
        setError('Сервер недоступен. Проверьте подключение и перезагрузите страницу позже.');
        alert('Сервер недоступен. Проверьте подключение и перезагрузите страницу позже.');
      }
      
      // Показываем fallback данные только если это уместно
      if (showFallback) {
        setPosts(initialPosts);
      }
    } finally {
      setLoading(false);
    }
  };

  // Загрузка постов при монтировании компонента
  useEffect(() => {
    loadPosts();
    
    // Очистка blob URL при размонтировании
    return () => {
      posts.forEach(post => {
        if (post.images) {
          post.images.forEach(url => {
            if (url.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
          });
        }
        if (post.video && post.video.startsWith('blob:')) {
          URL.revokeObjectURL(post.video);
        }
        if (post.doc && post.doc.startsWith('blob:')) {
          URL.revokeObjectURL(post.doc);
        }
      });
    };
  }, []);

  // Анимация медленного затухания лампочки
  useEffect(() => {
    if (!statusLight.isFlashing && statusLight.intensity > 0.6) {
      const timer = setTimeout(() => {
        setStatusLight(prev => ({
          ...prev,
          intensity: Math.max(0.6, prev.intensity - 0.1)
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [statusLight.isFlashing, statusLight.intensity]);

  // Отслеживание статуса бэкенда
  useEffect(() => {
    const checkBackendStatus = async () => {
      // Сначала проверяем здоровье бэкенда через backendManager
      const isHealthy = await backendManager.checkBackendHealth();
      const status = backendManager.getBackendStatus();
      
      // Проверяем, изменился ли статус
      const statusChanged = status.isRunning !== previousBackendStatus.current.isRunning;
      setBackendStatus(status);
      previousBackendStatus.current = status;
      
      // Отправляем уведомления только при изменении статуса
      if (!status.isRunning && statusChanged) {
        // Бэкенд стал недоступен
        addNotification('Бэкенд не отвечает', 'error');
        
        // Создаем событие для отправки в MessageNotifications
        const backendNotificationEvent = new CustomEvent('backendStatusChanged', {
          detail: {
            type: 'backend_error',
            title: 'Сервер недоступен',
            message: 'Бэкенд не отвечает. Проверьте подключение.',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(backendNotificationEvent);
        
        // Устанавливаем серый цвет лампочки при отсутствии соединения
        setStatusLight({
          color: '#9e9e9e',
          intensity: 0.3,
          isFlashing: false
        });
      } else if (status.isRunning && statusChanged) {
        // Бэкенд восстановился
        addNotification(`Бэкенд восстановлен (${new Date().toLocaleTimeString()})`, 'success');
        
        // Создаем событие для отправки в MessageNotifications
        const backendRecoveredEvent = new CustomEvent('backendStatusChanged', {
          detail: {
            type: 'backend_recovered',
            title: 'Сервер восстановлен',
            message: 'Бэкенд снова доступен.',
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(backendRecoveredEvent);
        
        // Возвращаем зеленый цвет лампочки
        setStatusLight({
          color: '#4caf50',
          intensity: 0.6,
          isFlashing: false
        });
      } else if (status.isRunning && !statusChanged) {
        // Бэкенд работает стабильно - просто обновляем цвет лампочки
        setStatusLight({
          color: '#4caf50',
          intensity: 0.6,
          isFlashing: false
        });
      }
    };

    // Проверяем статус каждые 5 секунд
    const interval = setInterval(checkBackendStatus, 5000);
    checkBackendStatus(); // Первоначальная проверка

    return () => clearInterval(interval);
  }, []);

  // Загрузка реакций из localStorage
  useEffect(() => {
    const savedReactions = localStorage.getItem('userReactions');
    if (savedReactions) {
      setUserReactions(JSON.parse(savedReactions));
    }
  }, []);

  // Сохранение реакций в localStorage
  useEffect(() => {
    localStorage.setItem('userReactions', JSON.stringify(userReactions));
  }, [userReactions]);

  // Передача данных наверх для аналитики
  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate({
        posts,
        userReactions,
        comments,
      });
    }
  }, [posts, userReactions, comments, onDataUpdate]);

  // Закрытие AI-ассистента при изменении маршрута или других действиях
  useEffect(() => {
    if (aiChatOpen && setAiChatOpen) {
      // Закрываем AI-ассистент при любых изменениях в ленте
      const timer = setTimeout(() => {
        // Можно добавить логику для автоматического закрытия
      }, 300000); // 5 минут
      
      return () => clearTimeout(timer);
    }
  }, [aiChatOpen, setAiChatOpen]);

  // Симуляция реального времени
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        simulateNewPost();
      }
    }, 5000 + Math.random() * 10000); // 5-15 секунд
    return () => clearInterval(interval);
  }, [isOnline]);

  // Симуляция обновлений в реальном времени
  const simulateRealTimeUpdate = () => {
    const updateTypes = ['newPost', 'newReaction', 'newComment'];
    const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)];

    switch (randomType) {
      case 'newPost':
        simulateNewPost();
        break;
      case 'newReaction':
        simulateNewReaction();
        break;
      case 'newComment':
        simulateNewComment();
        break;
    }
  };

  // Симуляция нового поста от другого пользователя
  const simulateNewPost = () => {
    const fakeUsers = ['Анна', 'Михаил', 'Елена', 'Дмитрий', 'Ольга'];
    const fakeTexts = [
      'Продаю отличный ноутбук!',
      'Куплю iPhone в хорошем состоянии',
      'Отдам бесплатно книги',
      'Ищу соседа для съема квартиры',
      'Продаю велосипед, почти новый',
      'Куплю игровую приставку',
      'Отдам котенка в хорошие руки',
      'Ищу работу в IT сфере'
    ];
    const fakeSections = ['sell', 'buy', 'give', 'realty', 'tribune'];

    const newPost = {
      id: Date.now() + Math.random(),
      text: fakeTexts[Math.floor(Math.random() * fakeTexts.length)],
      images: [],
      video: null,
      doc: null,
      bg: '',
      section: fakeSections[Math.floor(Math.random() * fakeSections.length)],
      privacy: 'all',
      reactions: { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, angry: 0 },
      author: fakeUsers[Math.floor(Math.random() * fakeUsers.length)],
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
    };

    setPosts(prev => [newPost, ...prev.slice(0, 9)]); // Добавляем новый пост, убираем старые
    setLastUpdate(new Date());
    
    // Добавляем уведомление
    addNotification(`${newPost.author} опубликовал новый пост`);
  };

  // Симуляция новой реакции от другого пользователя
  const simulateNewReaction = () => {
    if ((posts || []).length === 0) return;

    const randomPost = (posts || [])[Math.floor(Math.random() * (posts || []).length)];
    const reactionTypes = Object.keys(REACTIONS);
    const randomReaction = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];

    setPosts(prev => prev.map(post => {
      if (post.id === randomPost.id) {
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [randomReaction]: (post.reactions[randomReaction] || 0) + 1
          }
        };
      }
      return post;
    }));
    
    // Добавляем уведомление
    addNotification(`Новая реакция ${REACTIONS[randomReaction].icon} на пост`);
  };

  // Симуляция нового комментария от другого пользователя
  const simulateNewComment = () => {
    if ((posts || []).length === 0) return;

    const fakeUsers = ['Анна', 'Михаил', 'Елена', 'Дмитрий', 'Ольга'];
    const fakeComments = [
      'Отличное предложение!',
      'Сколько стоит?',
      'Могу посмотреть?',
      'Интересно, напишите подробнее',
      'Есть вопросы по товару',
      'Могу забрать сегодня',
      'Фото есть?',
      'В каком районе?'
    ];

    const randomPost = (posts || [])[Math.floor(Math.random() * (posts || []).length)];
    const newComment = {
      id: Date.now() + Math.random(),
      author: fakeUsers[Math.floor(Math.random() * fakeUsers.length)],
      text: fakeComments[Math.floor(Math.random() * fakeComments.length)],
      time: new Date().toLocaleTimeString().slice(0, 5),
      replies: [],
      isAI: false,
      likes: 0,
      liked: false,
    };

    setComments(prev => ({
      ...prev,
      [randomPost.id]: prev[randomPost.id] ? [newComment, ...prev[randomPost.id]] : [newComment]
    }));
    
    // Добавляем уведомление
    addNotification(`${newComment.author} оставил комментарий`);
  };

  // Добавление уведомления с анимацией лампочки
  const addNotification = (message, type = 'success') => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date(),
      type
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Максимум 5 уведомлений
    
    // Анимация лампочки
    const lightColor = type === 'error' ? '#f44336' : '#4caf50';
    setStatusLight({
      color: lightColor,
      intensity: 1,
      isFlashing: true
    });
    
    // Убираем вспышку через 300ms
    setTimeout(() => {
      setStatusLight(prev => ({
        ...prev,
        intensity: 0.6,
        isFlashing: false
      }));
    }, 300);
    
    // Автоматически убираем уведомление через 5 секунд
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
  };
  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]);
  };
  const handleDocChange = (e) => {
    setDoc(e.target.files[0]);
  };

  // Функция создания поста
  const handleCreatePost = async () => {
    if (!text.trim() && images.length === 0 && !video && !doc) {
      setErrorPost('Добавьте текст или медиафайлы для создания поста');
      return;
    }
    setLoadingPost(true);
    setErrorPost('');
    try {
      const postData = {
        content: text,
        media_urls: images.map(f => f.name),
        media_type: video ? 'video' : doc ? 'document' : images.length > 0 ? 'image' : null,
        background_color: bg,
        privacy: privacy === 'all' ? 'public' : privacy === 'private' ? 'private' : 'friends',
        section: section,
        location: null,
        is_ai_generated: false,
        ai_prompt: null
      };
      const response = await postsAPI.createPost(postData);
      setText('');
      setImages([]);
      setVideo(null);
      setDoc(null);
      setPrivacy('all');
      setSection('tribune');
      setBg('');
      if (onDataUpdate) onDataUpdate({ type: 'post_created', post: response.post });
    } catch (err) {
      setErrorPost('Ошибка создания поста: ' + (err?.message || ''));
    } finally {
      setLoadingPost(false);
    }
  };

  const handleAISend = () => {
    if (!aiInput.trim()) return;
    
    const userMessage = { text: aiInput, isUser: true };
    setAIMessages(prev => [...prev, userMessage]);
    
    // Генерируем умный ответ AI
    const aiResponse = generateAIResponse(aiInput);
    
    setTimeout(() => {
      setAIMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    }, 1000);
    
    setAIInput('');
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    // Помощь с созданием постов
    if (input.includes('пост') || input.includes('публикация') || input.includes('создать')) {
      return 'Отлично! Для создания поста:\n1. Нажмите "Что у вас нового?"\n2. Выберите раздел (Трибуна, Продам, Куплю и т.д.)\n3. Добавьте фото/видео при необходимости\n4. Выберите цвет фона для красоты\n5. Нажмите "Опубликовать"\n\nХотите, чтобы я помог составить текст поста?';
    }
    
    // Помощь с продажами
    if (input.includes('продаж') || input.includes('продать') || input.includes('цена')) {
      return 'Советы для успешной продажи:\n• Добавьте качественные фото\n• Укажите точную цену\n• Опишите состояние товара\n• Будьте готовы к торгу\n• Отвечайте быстро на сообщения\n\nКакой товар планируете продавать?';
    }
    
    // Помощь с покупками
    if (input.includes('покупк') || input.includes('купить') || input.includes('найти')) {
      return 'Для поиска товаров:\n• Используйте поиск в верхней панели\n• Фильтруйте по категориям\n• Сравнивайте цены\n• Проверяйте рейтинг продавца\n• Договаривайтесь о встрече\n\nЧто ищете?';
    }
    
    // Общие вопросы
    if (input.includes('помощь') || input.includes('как') || input.includes('что')) {
      return 'Я могу помочь с:\n• Созданием постов\n• Советами по продажам\n• Поиском товаров\n• Настройкой профиля\n• Использованием функций\n\nЧто именно вас интересует?';
    }
    
    // Приветствие
    if (input.includes('привет') || input.includes('здравствуй')) {
      return 'Привет! Рад вас видеть! Чем могу помочь сегодня?';
    }
    
    // Благодарность
    if (input.includes('спасибо') || input.includes('благодарю')) {
      return 'Пожалуйста! Всегда рад помочь. Если понадобится что-то еще - обращайтесь! 😊';
    }
    
    // По умолчанию
    return 'Интересный вопрос! Давайте разберемся вместе. Можете уточнить, что именно вас интересует? Я готов помочь с созданием постов, продажами, покупками и многим другим.';
  };

  const handleInsertAI = (msg) => {
    setText(text ? text + '\n' + msg : msg);
    setAIOpen(false);
  };

  // Обработка реакций на посты
  const handleReaction = (postId, reactionType) => {
    // Устанавливаем состояние загрузки
    setReactionLoading(prev => ({ ...prev, [postId]: true }));

    // Запускаем анимацию
    setReactionAnimations(prev => ({
      ...prev,
      [postId]: { reaction: reactionType, active: true }
    }));

    // Убираем анимацию через 800ms
    setTimeout(() => {
      setReactionAnimations(prev => ({
        ...prev,
        [postId]: { reaction: reactionType, active: false }
      }));
    }, 800);

    // Haptic feedback для мобильных устройств
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Звуковой эффект
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      const frequencies = { like: 800, love: 1000, laugh: 600, wow: 1200, sad: 400, angry: 300 };
      oscillator.frequency.setValueAtTime(frequencies[reactionType] || 800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Игнорируем ошибки аудио
    }

    // Имитируем задержку сети
    setTimeout(() => {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const currentReaction = userReactions[postId];
          const newReactions = { ...post.reactions };
          
          // Убираем предыдущую реакцию
          if (currentReaction && currentReaction !== reactionType) {
            newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
          }
          
          // Добавляем новую реакцию или убираем если та же
          if (currentReaction === reactionType) {
            newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
            setUserReactions(prev => ({ ...prev, [postId]: null }));
          } else {
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
            setUserReactions(prev => ({ ...prev, [postId]: reactionType }));
          }
          
          return { ...post, reactions: newReactions };
        }
        return post;
      }));

      // Убираем состояние загрузки
      setReactionLoading(prev => ({ ...prev, [postId]: false }));
    }, 200);
  };

  // Открытие поповера с реакциями
  const handleReactionClick = (event, postId) => {
    setReactionAnchor(prev => ({ ...prev, [postId]: event.currentTarget }));
  };

  // Закрытие поповера
  const handleReactionClose = (postId) => {
    setReactionAnchor(prev => ({ ...prev, [postId]: null }));
  };

  // Получение основной реакции для отображения
  const getMainReaction = (reactions) => {
    const total = Object.values(reactions).reduce((sum, count) => sum + count, 0);
    if (total === 0) return null;
    
    const sorted = Object.entries(reactions)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a);
    
    return sorted[0]?.[0] || null;
  };

  // Получение общего количества реакций
  const getTotalReactions = (reactions) => {
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  // Добавить комментарий к посту
  const handleAddComment = (postId) => {
    const newComment = {
      id: Date.now(),
      author: 'Вы',
      text: commentValue[postId],
      time: new Date().toLocaleTimeString().slice(0, 5),
      replies: [],
      isAI: false,
      likes: 0,
      liked: false,
    };
    setComments(prev => ({
      ...prev,
      [postId]: prev[postId] ? [ ...prev[postId], newComment ] : [ newComment ]
    }));
    setCommentValue(prev => ({ ...prev, [postId]: '' }));
  };

  // Добавить ответ к комментарию (ветка)
  const handleAddReply = (postId, commentId, text) => {
    setComments(prev => {
      const updateReplies = (arr) => arr.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [ ...(c.replies || []), {
              id: Date.now(),
              author: 'Вы',
              text,
              time: new Date().toLocaleTimeString().slice(0, 5),
              replies: [],
              isAI: false,
              likes: 0,
              liked: false,
            } ]
          };
        } else if (c.replies) {
          return { ...c, replies: updateReplies(c.replies) };
        }
        return c;
      });
      return {
        ...prev,
        [postId]: updateReplies(prev[postId] || [])
      };
    });
    setReplyValue('');
  };

  // Лайк комментария
  const handleLikeComment = (commentId) => {
    // Haptic feedback для мобильных устройств
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Звуковой эффект для комментариев
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (e) {
      // Игнорируем ошибки аудио
    }

    setComments(prev => {
      const updateCommentLikes = (arr) => arr.map(c => {
        if (c.id === commentId) {
          return { ...c, likes: c.liked ? c.likes - 1 : c.likes + 1, liked: !c.liked };
        } else if (c.replies) {
          return { ...c, replies: updateCommentLikes(c.replies) };
        }
        return c;
      });
      
      const newComments = {};
      Object.keys(prev).forEach(postId => {
        newComments[postId] = updateCommentLikes(prev[postId] || []);
      });
      return newComments;
    });
  };

  // Обработка изменений настроек
  const handleSettingsChange = (settings) => {
    setUserSettings(settings);
    // Применяем фильтры к постам
    applyFilters(settings.filters);
  };

  // Применение фильтров к постам
  const applyFilters = (filters) => {
    if (!filters) return;
    
    // Здесь можно добавить логику фильтрации постов
    // Пока просто сохраняем настройки
    console.log('Применяем фильтры:', filters);
  };

  // Фильтрация и сортировка постов
  const getFilteredAndSortedPosts = () => {
    if (!userSettings?.filters) return posts;

    let filteredPosts = [...posts];

    // Фильтрация по разделам
    if (userSettings.filters.sections && !userSettings.filters.sections.includes('all')) {
      filteredPosts = filteredPosts.filter(post => 
        userSettings.filters.sections.includes(post.section)
      );
    }

    // Фильтрация по минимальному количеству реакций
    if (userSettings.filters.minReactions > 0) {
      filteredPosts = filteredPosts.filter(post => {
        const totalReactions = getTotalReactions(post.reactions);
        return totalReactions >= userSettings.filters.minReactions;
      });
    }

    // Сортировка
    switch (userSettings.filters.sortBy) {
      case 'oldest':
        filteredPosts.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
        break;
      case 'popular':
        filteredPosts.sort((a, b) => {
          const reactionsA = getTotalReactions(a.reactions);
          const reactionsB = getTotalReactions(b.reactions);
          return reactionsB - reactionsA;
        });
        break;
      case 'reactions':
        filteredPosts.sort((a, b) => {
          const reactionsA = getTotalReactions(a.reactions);
          const reactionsB = getTotalReactions(b.reactions);
          return reactionsB - reactionsA;
        });
        break;
      case 'newest':
      default:
        filteredPosts.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        break;
    }

    return filteredPosts;
  };

  // Получение отфильтрованных постов
  const filteredPosts = getFilteredAndSortedPosts();

  useEffect(() => {
    if (open && postInputRef.current) {
      postInputRef.current.focus();
    }
  }, [open]);

  // Заменяем генерацию placeholder-изображения
  const getPlaceholderImage = (url) => {
    // Генерируем placeholder через API с помощью Jimp
    const encodedUrl = encodeURIComponent(url);
    return `/api/admin/placeholder/400/300/cccccc/666666/${encodedUrl}`;
  };

  // Функция для выбора иконки события
  const getEventIcon = (type, message) => {
    // Безопасная проверка параметров
    const safeType = type || '';
    const safeMessage = message || '';
    
    if (safeType === 'error' || /бэкенд не отвечает|ошибка/i.test(safeMessage)) {
      return <ErrorIcon sx={{ color: 'error.main', fontSize: 22 }} />;
    }
    if (/опубликовал пост/i.test(safeMessage)) {
      return <PostAddIcon sx={{ color: 'primary.main', fontSize: 22 }} />;
    }
    if (/лайк|реакц/i.test(safeMessage)) {
      return <ThumbUpIcon sx={{ color: 'success.main', fontSize: 20 }} />;
    }
    if (/коммент/i.test(safeMessage)) {
      return <ChatBubbleIcon sx={{ color: 'info.main', fontSize: 20 }} />;
    }
    return <NotificationsIcon sx={{ color: 'grey.600', fontSize: 20 }} />;
  };

  // Функция для тултипа лампочки статуса
  const getStatusTooltip = () => {
    if (statusLight.color === '#4caf50') return 'Онлайн';
    if (statusLight.color === '#9e9e9e') return 'Офлайн';
    if (statusLight.color === '#f44336') return 'Бэкенд не отвечает';
    return 'Статус неизвестен';
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', minHeight: '100vh', m: 0, p: 0, maxWidth: 'none', bgcolor: 'background.default' }}>
      {/* Верхняя панель с кнопками открытия боковых панелей */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 1, mb: 1 }}>
        {/* Кнопка открытия левой панели */}
        {!leftSidebarOpen && (
          <IconButton 
            onClick={e => {
              if (e.altKey || e.ctrlKey) {
                onHidePresentation();
              } else {
                setLeftSidebarOpen(true);
              }
            }} 
            sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 2, mr: 1 }}
            title="Открыть левую панель (Alt/Ctrl+клик — презентация)"
          >
            <MenuIcon />
          </IconButton>
        )}
        {/* Логотип */}
        <Box sx={{ flex: 1 }} />
        {/* Кнопка открытия правой панели */}
        {!rightSidebarOpen && (
          <IconButton 
            onClick={() => setRightSidebarOpen(true)} 
            sx={{ bgcolor: 'primary.main', color: 'white', boxShadow: 2 }}
            title="Открыть правую панель"
          >
            <PeopleIcon />
          </IconButton>
        )}
      </Box>

      {/* Презентационный пост */}
      {showPresentation && (
        <Card sx={{
          mb: 3,
          borderRadius: 4,
          boxShadow: 8,
          bgcolor: 'linear-gradient(135deg, #fffde4 0%, #fcb69f 100%)',
          border: '2px solid',
          borderColor: 'primary.main',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(-24px)' },
            to: { opacity: 1, transform: 'none' }
          }
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: { xs: 2, sm: 3 } }}>
            <StarIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1, filter: 'drop-shadow(0 4px 16px #ffeb3b88)' }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 1, textAlign: 'center', textShadow: '0 2px 8px #ffeb3b44' }}>
              AI Market — ваш умный маркетплейс
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2, textAlign: 'center' }}>
              Современная платформа для общения, продаж, покупок и обмена опытом с AI-помощником.
            </Typography>
            <Box sx={{ mb: 2, width: '100%' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Возможности:</b>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#444', fontSize: 16 }}>
                <li>Публикация и поиск объявлений (продажа, покупка, обмен)</li>
                <li>AI-ассистент для генерации текстов, советов, поиска товаров</li>
                <li>Умная лента с реакциями, комментариями и быстрыми уведомлениями</li>
                <li>Мобильная адаптивность и современный дизайн</li>
                <li>Безопасность и приватность ваших данных</li>
              </ul>
            </Box>
            <Box sx={{ mb: 2, width: '100%' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Почему выбирают нас?</b>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#444', fontSize: 16 }}>
                <li>Интуитивный интерфейс</li>
                <li>Мгновенные уведомления о событиях</li>
                <li>AI-помощник всегда под рукой</li>
                <li>Яркий и запоминающийся стиль</li>
              </ul>
            </Box>
            {onHidePresentation && (
              <Button variant="contained" color="primary" onClick={onHidePresentation} sx={{ mt: 2, fontWeight: 700, borderRadius: 2 }}>
                Скрыть презентацию
              </Button>
            )}
          </Box>
        </Card>
      )}

      {/* Панель статуса времени и шестеренки */}
      <Box 
        data-status-panel="true"
        sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: theme => theme.palette.background.paper, 
          borderRadius: 2,
          border: 1,
          borderColor: theme => theme.palette.divider,
          boxShadow: theme => theme.shadows[1]
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              {/* Лампочка статуса с тултипом "Онлайн"/"Офлайн" */}
              <Tooltip title={getStatusTooltip()} arrow>
                <Box
                  sx={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: statusLight.color,
                    opacity: statusLight.intensity,
                    boxShadow: statusLight.isFlashing 
                      ? `0 0 0 0 ${statusLight.color}40`
                      : `0 0 0 0 ${statusLight.color}60`,
                    animation: statusLight.isFlashing 
                      ? 'elegantFlash 2s ease-in-out infinite'
                      : statusLight.color === '#4caf50' 
                        ? 'elegantPulse 3s ease-in-out infinite'
                        : 'none',
                    '@keyframes elegantFlash': {
                      '0%':   { 
                        opacity: 0.3,
                        boxShadow: `0 0 0 0 ${statusLight.color}20`,
                        transform: 'scale(0.8)'
                      },
                      '50%':  { 
                        opacity: 1,
                        boxShadow: `0 0 0 6px ${statusLight.color}40`,
                        transform: 'scale(1.2)'
                      },
                      '100%': { 
                        opacity: 0.3,
                        boxShadow: `0 0 0 0 ${statusLight.color}20`,
                        transform: 'scale(0.8)'
                      },
                    },
                    '@keyframes elegantPulse': {
                      '0%':   { 
                        opacity: 0.4,
                        boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.3)',
                        transform: 'scale(0.9)'
                      },
                      '50%':  { 
                        opacity: 0.8,
                        boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.1)',
                        transform: 'scale(1.1)'
                      },
                      '100%': { 
                        opacity: 0.4,
                        boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.3)',
                        transform: 'scale(0.9)'
                      },
                    },
                    transition: 'all 0.5s ease',
                    cursor: 'pointer',
                    mr: 1
                  }}
                  onClick={() => setShowAllEvents(!showAllEvents)}
                />
              </Tooltip>
              {/* Краткая надпись с датой и временем последнего обновления */}
              <Tooltip title="Время последнего обновления" arrow>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    ml: 0.5,
                    userSelect: 'none',
                    cursor: 'pointer',
                    display: 'inline-block',
                    verticalAlign: 'middle'
                  }}
                >
                  {`${lastUpdate.toLocaleTimeString().slice(0,5)} ${lastUpdate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`}
                </Typography>
              </Tooltip>
              {/* Иконка последнего события — сразу после времени */}
              {notifications.length > 0 && (
                <Tooltip title={notifications[0]?.message || 'Нет событий'} arrow>
                                      <Box onClick={() => setShowAllEvents(true)} sx={{ cursor: 'pointer', ml: 1 }}>
                      {getEventIcon(notifications[0]?.type, notifications[0]?.message)}
                    </Box>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {!isMobile && (
              <Tooltip title={isOnline ? 'Отключить реальное время' : 'Включить реальное время'} arrow>
                <Box
                  onClick={() => {
                    setIsOnline(!isOnline);
                    if (!isOnline) setLastUpdate(new Date());
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 0.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: isOnline ? 'primary.50' : 'grey.100',
                    color: isOnline ? 'primary.main' : 'grey.600',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                    '&:hover': {
                      bgcolor: isOnline ? 'primary.100' : 'grey.200',
                      color: isOnline ? 'primary.dark' : 'grey.800',
                    }
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 20 }} />
                </Box>
              </Tooltip>
            )}
            <IconButton 
              size={isMobile ? "small" : "medium"}
              onClick={() => navigate('/settings')}
              sx={{ 
                color: 'text.secondary',
                bgcolor: 'primary.50',
                '&:hover': { 
                  color: 'primary.main',
                  bgcolor: 'primary.100'
                }
              }}
            >
              <SettingsIcon sx={{ fontSize: isMobile ? 18 : 24 }} />
            </IconButton>
          </Box>
        </Stack>
      </Box>

      {/* Лента событий */}
      {/* Развёрнутая лента событий (иконка последнего события всегда сверху, под ней — список) */}
      {showAllEvents && (
        <Box sx={{
          mt: 1,
          mb: 2,
          px: 1,
          py: 1,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 0,
          maxHeight: 180,
          overflowY: 'auto',
          border: '1px solid',
          borderColor: 'grey.100',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}>
          {/* Иконка последнего события всегда сверху */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            justifyContent: 'flex-start',
            mb: 0.5
          }}>
                          <Tooltip title={notifications[0]?.message || 'Нет событий'} arrow>
              <Box>
                                  {getEventIcon(notifications[0]?.type, notifications[0]?.message)}
              </Box>
            </Tooltip>
            <Typography variant="body2" sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              fontWeight: 400,
              flex: 1
            }}>
                              {notifications[0]?.message || 'Нет событий'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, minWidth: 36, textAlign: 'right' }}>
              {notifications[0]?.timestamp
                ? (notifications[0].timestamp instanceof Date
                    ? notifications[0].timestamp.toLocaleTimeString().slice(0, 5)
                    : new Date(notifications[0].timestamp).toLocaleTimeString().slice(0, 5))
                : ''}
            </Typography>
          </Box>
          {/* Остальные события (кроме первого) */}
          {notifications.length > 1 && notifications.slice(1).map(n => (
            <Box key={n.id} sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'transparent',
              minWidth: 0,
              maxWidth: '100%',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: n.type === 'error' ? 'error.main' : 'text.primary',
              fontWeight: 400
            }}>
                                  {getEventIcon(n?.type, n?.message)}
              <Typography variant="body2" sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                fontWeight: 400,
                flex: 1
              }}>
                {n?.message || 'Нет сообщения'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, minWidth: 36, textAlign: 'right' }}>
                {n?.timestamp
                  ? (n.timestamp instanceof Date
                      ? n.timestamp.toLocaleTimeString().slice(0, 5)
                      : new Date(n.timestamp).toLocaleTimeString().slice(0, 5))
                  : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Маленькая форма "Что у вас нового?" */}
      {!open && (
        <Card sx={{ mb: 3, bgcolor: theme => theme.palette.background.paper, borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: 16 }}>
                {currentUser?.name?.[0] || 'A'}
              </Avatar>
              <TextField
                fullWidth
                placeholder="Что у вас нового?"
                variant="outlined"
                onClick={() => setOpen(true)}
                sx={{ 
                  bgcolor: theme => theme.palette.background.default, 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: theme => theme.palette.action.hover
                    }
                  }
                }}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <InsertEmoticonIcon fontSize="small" />
                    </Box>
                  )
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Панель создания поста */}
      {open && (
        <Card sx={{
          bgcolor: theme => theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: 3,
          overflow: 'hidden',
          mx: 0,
          width: { xs: '100%', sm: 'auto' },
          mb: { xs: 0, sm: 3 },
        }}>
          <CardContent sx={{ 
            p: { xs: 0, sm: 3 },
            px: { xs: 0, sm: 3 },
            '&:last-child': { pb: { xs: 0, sm: 3 } }
          }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 1, sm: 2 } }}>
              <Typography variant="h6" fontSize={{ xs: 16, sm: 20 }}>Создать пост</Typography>
              <IconButton onClick={() => setOpen(false)} size={isMobile ? 'small' : 'medium'}>
                <CloseIcon />
              </IconButton>
            </Stack>
            {/* ErrorDisplay отключен для устранения всплывающих ошибок */}
            <TextField
              inputRef={postInputRef}
              label="Текст поста"
              multiline
              fullWidth
              minRows={isMobile ? 2 : 4}
              value={text}
              onChange={e => setText(e.target.value)}
              sx={{ 
                mb: 2, 
                bgcolor: theme => theme.palette.background.default, 
                borderRadius: 2, 
                fontSize: { xs: 14, sm: 16 },
                '& .MuiOutlinedInput-root': {
                  fontSize: { xs: 14, sm: 16 }
                }
              }}
              placeholder="Что у вас нового?"
            />
            <Stack 
              direction="row" 
              spacing={isMobile ? 1 : 2} 
              alignItems="center" 
              sx={{ 
                mb: 2, 
                flexWrap: 'wrap',
                gap: { xs: 0.5, sm: 1 }
              }}
            >
              <Button 
                component="label" 
                startIcon={<PhotoCameraIcon />} 
                variant="outlined" 
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Фото
                <input type="file" hidden multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} />
              </Button>
              <Button 
                component="label" 
                startIcon={<VideoLibraryIcon />} 
                variant="outlined" 
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Видео
                <input type="file" hidden accept="video/*" onChange={e => setVideo(e.target.files[0])} />
              </Button>
              <Button 
                component="label" 
                startIcon={<InsertDriveFileIcon />} 
                variant="outlined" 
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 }
                }}
              >
                Документ
                <input type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={e => setDoc(e.target.files[0])} />
              </Button>
              <FormControl 
                sx={{ 
                  minWidth: { xs: 80, sm: 120 },
                  flex: { xs: '1 1 auto', sm: '0 0 auto' }
                }} 
                size={isMobile ? 'small' : 'medium'}
              >
                <InputLabel>Приватность</InputLabel>
                <Select value={privacy} label="Приватность" onChange={e => setPrivacy(e.target.value)}>
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="private">Только я</MenuItem>
                </Select>
              </FormControl>
              <FormControl 
                sx={{ 
                  minWidth: { xs: 80, sm: 120 },
                  flex: { xs: '1 1 auto', sm: '0 0 auto' }
                }} 
                size={isMobile ? 'small' : 'medium'}
              >
                <InputLabel>Раздел</InputLabel>
                <Select value={section} label="Раздел" onChange={e => setSection(e.target.value)}>
                  {SECTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center" 
              sx={{ 
                mb: 2, 
                flexWrap: 'wrap',
                gap: 0.5
              }}
            >
              {images.map((img, i) => (
                <Chip 
                  key={i} 
                  label={img.name} 
                  size={isMobile ? 'small' : 'medium'} 
                  onDelete={() => setImages(images.filter((_, index) => index !== i))}
                  sx={{ maxWidth: { xs: 120, sm: 200 } }}
                />
              ))}
              {video && (
                <Chip 
                  label={video.name} 
                  size={isMobile ? 'small' : 'medium'} 
                  onDelete={() => setVideo(null)}
                  sx={{ maxWidth: { xs: 120, sm: 200 } }}
                />
              )}
              {doc && (
                <Chip 
                  label={doc.name} 
                  size={isMobile ? 'small' : 'medium'} 
                  onDelete={() => setDoc(null)}
                  sx={{ maxWidth: { xs: 120, sm: 200 } }}
                />
              )}
            </Stack>
            <Stack 
              direction="row" 
              spacing={isMobile ? 1 : 2} 
              justifyContent="flex-end"
              sx={{ 
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Button 
                onClick={() => setOpen(false)} 
                size={isMobile ? 'small' : 'medium'}
                sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
              >
                Отмена
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  handleCreatePost();
                  setOpen(false);
                }} 
                disabled={loadingPost || (!text && images.length === 0 && !video && !doc)}
                size={isMobile ? 'small' : 'medium'}
                sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
              >
                {loadingPost ? 'Создание...' : 'Опубликовать'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
      
      {/* AI-ассистент */}
      {aiChatOpen && (
        <Box sx={{ mb: 3 }}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, bgcolor: theme => theme.palette.background.paper }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>AI-ассистент</Typography>
                <IconButton size="small" onClick={() => setAiChatOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ maxHeight: 220, overflowY: 'auto', mb: 1 }}>
                {aiMessages.map((msg, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start', mb: 1 }}>
                    <Box sx={{ 
                      bgcolor: msg.isUser ? 'primary.main' : theme => theme.palette.background.default, 
                      color: msg.isUser ? 'white' : theme => theme.palette.text.primary, 
                      borderRadius: 2, 
                      px: 2, 
                      py: 1, 
                      maxWidth: '80%',
                      border: msg.isUser ? 'none' : `1px solid ${theme => theme.palette.divider}`
                    }}>
                      {msg.text}
                    </Box>
                    {msg.isUser === false && (
                      <Button size="small" sx={{ ml: 1 }} onClick={() => handleInsertAI(msg.text)}>Вставить в пост</Button>
                    )}
                  </Box>
                ))}
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Задать вопрос AI..."
                value={aiInput}
                onChange={e => setAIInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAISend()}
                sx={{ bgcolor: theme => theme.palette.background.paper, borderRadius: 2 }}
              />
              <Button color="primary" variant="contained" fullWidth onClick={handleAISend} sx={{ mt: 1, borderRadius: 2 }}>
                <SmartToyIcon />
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}
      {/* Лента постов */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Загрузка постов...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Ошибка загрузки постов. Проверьте подключение к серверу.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 0, sm: 2 }} sx={{ m: 0, px: 0, maxWidth: 'none', width: '100%' }}>
          {filteredPosts.map(post => (
            <Grid item xs={12} key={post.id} sx={{ m: 0, p: 0, mx: 0, px: 0, width: { xs: '100%', sm: 'auto' } }}>
              <PostCard post={post} />
            </Grid>
          ))}
        </Grid>
      )}
      {/* FAB только для мобильных */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="Создать пост"
          onClick={() => navigate('/post/new')}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16, 
            zIndex: 1000, 
            boxShadow: 3, 
            '&:hover': { 
              transform: 'scale(1.1)', 
              boxShadow: 6 
            }, 
            transition: 'all 0.2s ease-in-out' 
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Feed; 