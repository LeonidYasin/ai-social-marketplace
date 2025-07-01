import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, CardMedia, Grid, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, Tabs, Tab, Divider, Tooltip, ToggleButtonGroup, ToggleButton, Popover, Chip, useTheme, useMediaQuery, Fab, InputBase } from '@mui/material';
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
import UserSettings from './UserSettings';
import PostCard from './PostCard';

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

const Feed = ({ onDataUpdate, currentUser }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [posts, setPosts] = useState(initialPosts);
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
  // Настройки пользователя
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // Симуляция реального времени
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOnline) return;

      // Случайные обновления каждые 5-15 секунд
      const shouldUpdate = Math.random() < 0.3; // 30% вероятность
      if (shouldUpdate) {
        simulateRealTimeUpdate();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOnline, posts]);

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
    if (posts.length === 0) return;

    const randomPost = posts[Math.floor(Math.random() * posts.length)];
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
    if (posts.length === 0) return;

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

    const randomPost = posts[Math.floor(Math.random() * posts.length)];
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

  // Добавление уведомления
  const addNotification = (message) => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Максимум 5 уведомлений
    
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

  const handlePost = (aiDialog = null) => {
    setPosts([
      {
        id: Date.now(),
        userId: currentUser?.id,
        text: aiDialog ? aiDialog.map(m => (m.isUser ? 'Вы: ' : 'AI: ') + m.text).join('\n') : text,
        images: images.map(f => URL.createObjectURL(f)),
        video: video ? URL.createObjectURL(video) : null,
        doc: doc ? doc.name : null,
        bg,
        section,
        privacy,
        reactions: { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, angry: 0 },
        createdAt: new Date().toISOString(),
      },
      ...posts,
    ]);
    setText('');
    setImages([]);
    setVideo(null);
    setDoc(null);
    setPrivacy('all');
    setSection('tribune');
    setBg('');
    setAIMessages(initialAIMessages);
    setAIInput('');
    setOpen(false);
    setAIOpen(false);
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

  return (
    <Box sx={{ bgcolor: theme => theme.palette.background.default }}>
      {/* Индикатор онлайн статуса и последнего обновления */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: isOnline ? 'success.main' : 'error.main',
            animation: isOnline ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.5 },
              '100%': { opacity: 1 },
            }
          }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: isSmallMobile ? '0.7rem' : '0.75rem' }}>
            {isOnline ? 'Онлайн' : 'Офлайн'}
            {!isSmallMobile && ` • Последнее обновление: ${lastUpdate.toLocaleTimeString()}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {!isSmallMobile && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setIsOnline(!isOnline);
                if (!isOnline) {
                  setLastUpdate(new Date());
                }
              }}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
            >
              {isOnline ? 'Отключить' : 'Включить'} реальное время
            </Button>
          )}
          <Tooltip title="Настройки">
            <IconButton
              size={isSmallMobile ? "small" : "medium"}
              onClick={() => setSettingsOpen(true)}
              sx={{ 
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: 'primary.100' }
              }}
            >
              <SettingsIcon sx={{ fontSize: isSmallMobile ? 18 : 24 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Уведомления о новых обновлениях */}
      {notifications.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {notifications.map((notification) => (
            <Chip
              key={notification.id}
              label={notification.message}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ 
                mr: 1, 
                mb: 1,
                animation: 'slideIn 0.3s ease-out',
                '@keyframes slideIn': {
                  '0%': { transform: 'translateY(-20px)', opacity: 0 },
                  '100%': { transform: 'translateY(0)', opacity: 1 },
                }
              }}
              onDelete={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            />
          ))}
        </Box>
      )}

      {/* Индикатор активных фильтров */}
      {userSettings?.filters && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Активные фильтры:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {userSettings.filters.sections && !userSettings.filters.sections.includes('all') && (
              <Chip
                label={`Разделы: ${userSettings.filters.sections.map(s => SECTIONS.find(sec => sec.value === s)?.label).join(', ')}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            {userSettings.filters.sortBy && userSettings.filters.sortBy !== 'newest' && (
              <Chip
                label={`Сортировка: ${userSettings.filters.sortBy === 'oldest' ? 'Сначала старые' : 
                  userSettings.filters.sortBy === 'popular' ? 'По популярности' : 
                  userSettings.filters.sortBy === 'reactions' ? 'По реакциям' : 'Сначала новые'}`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
            {userSettings.filters.minReactions > 0 && (
              <Chip
                label={`Мин. реакций: ${userSettings.filters.minReactions}`}
                size="small"
                variant="outlined"
                color="info"
              />
            )}
            {userSettings.filters.showReactions === false && (
              <Chip
                label="Реакции скрыты"
                size="small"
                variant="outlined"
                color="warning"
              />
            )}
            {userSettings.filters.showComments === false && (
              <Chip
                label="Комментарии скрыты"
                size="small"
                variant="outlined"
                color="warning"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Facebook-style create post panel */}
      <Card sx={{ mb: 3, bgcolor: theme => theme.palette.background.paper, borderRadius: isMobile ? 2 : 3, boxShadow: 2, border: theme => theme.palette.mode === 'dark' ? '1.5px solid #00ffe7' : 'none' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2, p: isMobile ? 1.5 : 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, fontSize: isMobile ? 14 : 16 }}>
            {userSettings?.profile?.name?.[0] || 'A'}
          </Avatar>
          <Button
            variant="outlined"
            sx={{ 
              borderRadius: isMobile ? 6 : 8, 
              flex: 1, 
              justifyContent: 'flex-start', 
              color: 'text.secondary', 
              bgcolor: theme => theme.palette.background.default, 
              textTransform: 'none', 
              pl: isMobile ? 1.5 : 2, 
              boxShadow: 0,
              fontSize: isMobile ? '0.875rem' : '1rem',
              py: isMobile ? 1 : 1.5,
            }}
            onClick={() => setOpen(true)}
          >
            {isMobile ? 'Что нового?' : 'Что у вас нового?'}
          </Button>
        </CardContent>
      </Card>
      {/* Модальное окно создания поста с современным стилем */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isSmallMobile}
        PaperProps={{ 
          sx: { 
            borderRadius: isSmallMobile ? 0 : 3, 
            boxShadow: 3, 
            bgcolor: theme => theme.palette.background.paper,
            height: isSmallMobile ? '100%' : 'auto',
            border: theme => theme.palette.mode === 'dark' ? '1.5px solid #00ffe7' : 'none',
          } 
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: isSmallMobile ? 1 : 2,
        }}>
          <Stack direction="row" alignItems="center" gap={isMobile ? 1 : 2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: isMobile ? 36 : 44, height: isMobile ? 36 : 44 }}>
              {userSettings?.profile?.name?.[0] || 'A'}
            </Avatar>
            <Typography variant={isMobile ? "subtitle1" : "h6"}>Создать пост</Typography>
          </Stack>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0, pb: isSmallMobile ? 0 : 2 }}>
          {/* Тело поста */}
          <TextField
            label="Текст поста"
            multiline
            fullWidth
            minRows={isMobile ? 3 : 4}
            value={text}
            onChange={e => setText(e.target.value)}
            sx={{ 
              mb: isMobile ? 1.5 : 2, 
              mt: 1, 
              bgcolor: theme => theme.palette.background.default, 
              borderRadius: 2, 
              transition: 'background 0.3s' 
            }}
            InputProps={{ 
              style: bg ? { 
                background: bg, 
                color: '#222', 
                fontWeight: 600, 
                fontSize: isMobile ? 18 : 20 
              } : {} 
            }}
          />
          {/* Панелька выбора фона */}
          <Box sx={{ mb: isMobile ? 1.5 : 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: isMobile ? '0.875rem' : '1rem' }}>
              Фон публикации:
            </Typography>
            <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1, flexWrap: 'wrap' }}>
              {BG_COLORS.map((color, i) => (
                <Box
                  key={i}
                  onClick={() => setBg(color)}
                  sx={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    borderRadius: '50%',
                    bgcolor: color && !color.startsWith('linear') ? color : undefined,
                    background: color && color.startsWith('linear') ? color : undefined,
                    border: bg === color ? '2px solid #1976d2' : '2px solid #fff',
                    boxShadow: bg === color ? 2 : 1,
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    transform: bg === color ? 'scale(1.15)' : 'scale(1)',
                    outline: 'none',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'scale(1.15)',
                    },
                  }}
                  title={color ? 'Выбрать фон' : 'Без фона'}
                >
                  {!color && (
                    <Box sx={{ 
                      width: isMobile ? 16 : 18, 
                      height: isMobile ? 16 : 18, 
                      borderRadius: '50%', 
                      bgcolor: '#eee', 
                      m: 'auto', 
                      mt: isMobile ? '6px' : '7px' 
                    }} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
          {/* Все настройки под полем поста */}
          <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 1 : 2} alignItems={isMobile ? "stretch" : "center"} sx={{ mb: isMobile ? 1.5 : 2 }}>
            <FormControl sx={{ minWidth: isMobile ? '100%' : 120 }}>
              <InputLabel sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Приватность</InputLabel>
              <Select 
                value={privacy} 
                label="Приватность" 
                onChange={e => setPrivacy(e.target.value)}
                size={isMobile ? "small" : "medium"}
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="private">Только я</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: isMobile ? '100%' : 120 }}>
              <InputLabel sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>Раздел</InputLabel>
              <Select 
                value={section} 
                label="Раздел" 
                onChange={e => setSection(e.target.value)}
                size={isMobile ? "small" : "medium"}
              >
                {SECTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          {/* Панелька дополнить публикацию */}
          <Stack direction="row" spacing={isMobile ? 1 : 2} alignItems="center" sx={{ mb: isMobile ? 1.5 : 2, flexWrap: 'wrap' }}>
            <Tooltip title="Добавить фото">
              <IconButton component="label" size={isMobile ? "small" : "medium"}>
                <PhotoCameraIcon color={images.length ? 'primary' : 'action'} />
                <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Добавить видео">
              <IconButton component="label" size={isMobile ? "small" : "medium"}>
                <VideoLibraryIcon color={video ? 'primary' : 'action'} />
                <input type="file" hidden accept="video/*" onChange={handleVideoChange} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Добавить документ">
              <IconButton component="label" size={isMobile ? "small" : "medium"}>
                <InsertDriveFileIcon color={doc ? 'primary' : 'action'} />
                <input type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={handleDocChange} />
              </IconButton>
            </Tooltip>
            <Tooltip title="AI-подсказка">
              <IconButton onClick={() => setAIOpen(true)} size={isMobile ? "small" : "medium"}>
                <LightbulbIcon color="primary" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Эмодзи скоро!">
              <span><IconButton disabled size={isMobile ? "small" : "medium"}><InsertEmoticonIcon /></IconButton></span>
            </Tooltip>
          </Stack>
          {/* Вывод выбранных файлов */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            {images.map((img, i) => (
              <Typography key={i} variant="caption">{img.name}</Typography>
            ))}
            {video && <Typography variant="caption">{video.name}</Typography>}
            {doc && <Typography variant="caption">{doc.name}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={() => handlePost()} disabled={!text && images.length === 0 && !video && !doc}>Опубликовать</Button>
        </DialogActions>
      </Dialog>
      {/* AI-ассистент как отдельное модальное окно */}
      <Dialog open={aiOpen} onClose={() => setAIOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: 3, bgcolor: '#fff' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><SmartToyIcon /></Avatar>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>AI-ассистент</Typography>
          <IconButton onClick={() => setAIOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, pt: 1 }}>
          <Box sx={{ maxHeight: 220, overflowY: 'auto', px: 2, pb: 1 }}>
            {aiMessages.map((msg, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start', mb: 1 }}>
                <Box sx={{ bgcolor: msg.isUser ? 'primary.main' : 'grey.200', color: msg.isUser ? 'white' : 'black', borderRadius: 2, px: 2, py: 1, maxWidth: '80%' }}>
                  {msg.text}
                </Box>
                {msg.isUser === false && (
                  <Button size="small" sx={{ ml: 1 }} onClick={() => handleInsertAI(msg.text)}>Вставить в пост</Button>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Задать вопрос AI..."
            value={aiInput}
            onChange={e => setAIInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAISend()}
            sx={{ bgcolor: theme => theme.palette.background.paper, borderRadius: 2 }}
          />
          <Button color="primary" variant="contained" onClick={handleAISend} sx={{ minWidth: 40, ml: 1, borderRadius: 2 }}>
            <SmartToyIcon />
          </Button>
        </DialogActions>
        <Divider sx={{ my: 1 }} />
        <Button variant="outlined" color="primary" fullWidth onClick={() => handlePost(aiMessages)}>
          Опубликовать диалог как пост
        </Button>
      </Dialog>
      {/* Лента постов */}
      <Grid container spacing={isMobile ? 1 : 2}>
        {filteredPosts.map(post => (
          <Grid item xs={12} key={post.id}>
            <PostCard post={post} compact={false} />
          </Grid>
        ))}
      </Grid>

      {/* Плавающая кнопка для создания постов на мобильных */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="Создать пост"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            boxShadow: 3,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: 6,
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Компонент настроек пользователя */}
      <UserSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={handleSettingsChange}
      />

      {/* Lightbox Dialog */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="md"
        PaperProps={{ sx: { bgcolor: '#111', boxShadow: 24, borderRadius: 2, p: 0 } }}
      >
        <Box sx={{ position: 'relative', bgcolor: '#111', p: 0 }}>
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>
          {lightboxImages.length > 0 && (
            <img
              src={lightboxImages[lightboxIndex]}
              alt="Фото поста"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                display: 'block',
                margin: '0 auto',
                borderRadius: 8,
                background: '#222',
              }}
            />
          )}
          {/* Галерея: кнопки влево/вправо */}
          {lightboxImages.length > 1 && (
            <>
              <IconButton
                onClick={() => setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length)}
                sx={{ position: 'absolute', top: '50%', left: 8, color: '#fff', zIndex: 2, transform: 'translateY(-50%)' }}
              >
                {'<'}
              </IconButton>
              <IconButton
                onClick={() => setLightboxIndex((lightboxIndex + 1) % lightboxImages.length)}
                sx={{ position: 'absolute', top: '50%', right: 48, color: '#fff', zIndex: 2, transform: 'translateY(-50%)' }}
              >
                {'>'}
              </IconButton>
            </>
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default Feed; 