import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Badge,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Chat as ChatIcon,
  ThumbUp as LikeIcon,
  Comment as CommentIcon,
  PersonAdd as FollowIcon,
  TrendingUp as TrendingIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Message as MessageIcon,
} from '@mui/icons-material';

// Типы уведомлений
const NOTIFICATION_TYPES = [
  {
    key: 'messages',
    label: 'Сообщения',
    description: 'Новые сообщения в чатах',
    icon: ChatIcon,
    default: true,
  },
  {
    key: 'reactions',
    label: 'Реакции',
    description: 'Лайки и реакции на ваши посты',
    icon: LikeIcon,
    default: true,
  },
  {
    key: 'comments',
    label: 'Комментарии',
    description: 'Новые комментарии к вашим постам',
    icon: CommentIcon,
    default: true,
  },
  {
    key: 'followers',
    label: 'Подписчики',
    description: 'Новые подписчики',
    icon: FollowIcon,
    default: false,
  },
  {
    key: 'trending',
    label: 'Тренды',
    description: 'Популярные посты и тренды',
    icon: TrendingIcon,
    default: false,
  },
];

// Моковые уведомления
const generateMockNotifications = () => [
  {
    id: 1,
    type: 'messages',
    title: 'Новое сообщение',
    message: 'Анна отправила вам сообщение',
    time: '2 минуты назад',
    read: false,
    data: { userId: 'anna' },
  },
  {
    id: 2,
    type: 'reactions',
    title: 'Новая реакция',
    message: 'Михаил поставил лайк вашему посту',
    time: '5 минут назад',
    read: false,
    data: { postId: 1, reaction: 'like' },
  },
  {
    id: 3,
    type: 'comments',
    title: 'Новый комментарий',
    message: 'Елена прокомментировала ваш пост',
    time: '10 минут назад',
    read: true,
    data: { postId: 1, commentId: 1 },
  },
  {
    id: 4,
    type: 'followers',
    title: 'Новый подписчик',
    message: 'Петр подписался на вас',
    time: '1 час назад',
    read: false,
    data: { userId: 'petr' },
  },
  {
    id: 5,
    type: 'trending',
    title: 'Популярный пост',
    message: 'Ваш пост стал популярным в разделе "Продам"',
    time: '2 часа назад',
    read: true,
    data: { postId: 2 },
  },
];

const NotificationsManager = ({ socket, currentUser }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [browserPermission, setBrowserPermission] = useState('default');
  const [showSettings, setShowSettings] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [showNotificationsList, setShowNotificationsList] = useState(false);

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else {
      // Установка настроек по умолчанию
      const defaultSettings = {};
      NOTIFICATION_TYPES.forEach(type => {
        defaultSettings[type.key] = type.default;
      });
      setSettings(defaultSettings);
    }
  }, []);

  // Сохранение настроек в localStorage
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // Загрузка уведомлений
  useEffect(() => {
    setNotifications(generateMockNotifications());
  }, []);

  // Проверка разрешений браузера
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Запрос разрешения на уведомления
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setSnackbar({
        open: true,
        message: 'Ваш браузер не поддерживает уведомления',
        severity: 'warning'
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      
      if (permission === 'granted') {
        setSnackbar({
          open: true,
          message: 'Уведомления включены!',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Уведомления отключены',
          severity: 'info'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Ошибка при запросе разрешения',
        severity: 'error'
      });
    }
  };

  // Отправка push-уведомления
  const sendNotification = (title, options = {}) => {
    if (browserPermission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // TODO: Переход к соответствующему разделу
    };

    return notification;
  };

  // Изменение настроек уведомлений
  const handleSettingChange = (type, enabled) => {
    setSettings(prev => ({
      ...prev,
      [type]: enabled,
    }));
  };

  // Отметить уведомление как прочитанное
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Отметить все как прочитанные
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  // Удалить уведомление
  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Очистить все уведомления
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Получить иконку для типа уведомления
  const getNotificationIcon = (type) => {
    const notificationType = NOTIFICATION_TYPES.find(t => t.key === type);
    if (notificationType) {
      const Icon = notificationType.icon;
      return <Icon />;
    }
    return <NotificationsIcon />;
  };

  // Получить цвет для типа уведомления
  const getNotificationColor = (type) => {
    const colors = {
      messages: 'primary',
      reactions: 'success',
      comments: 'info',
      followers: 'warning',
      trending: 'secondary',
    };
    return colors[type] || 'default';
  };

  useEffect(() => {
    // Обработчик новых сообщений
    if (socket) {
      socket.on('newMessage', (message) => {
        // Проверяем, что сообщение не от текущего пользователя
        if (message.sender_id !== currentUser?.id) {
          handleNewMessage(message);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
      }
    };
  }, [socket, currentUser]);

  const handleNewMessage = (message) => {
    // Добавляем уведомление в список
    const newNotification = {
      id: Date.now(),
      type: 'message',
      title: `Новое сообщение от ${message.sender_username || 'пользователя'}`,
      content: message.content,
      timestamp: new Date(),
      read: false,
      sender: {
        id: message.sender_id,
        username: message.sender_username,
        avatar: null
      }
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Храним последние 10
    setUnreadCount(prev => prev + 1);

    // Показываем уведомление в интерфейсе
    setSnackbarMessage(newNotification.title);
    setSnackbarSeverity('info');
    setShowSnackbar(true);

    // Показываем браузерное уведомление
    showBrowserNotification(newNotification);
  };

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.content,
        icon: '/favicon.ico', // Можно заменить на иконку приложения
        tag: 'new-message',
        requireInteraction: false
      });
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} дн назад`;
  };

  return (
    <>
      <Dialog
        open={showNotificationsList}
        onClose={() => setShowNotificationsList(false)}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon />
            <Typography variant="h6">
              Уведомления {unreadCount > 0 && `(${unreadCount})`}
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={() => setShowNotificationsList(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Статус браузерных уведомлений */}
          <Card variant="outlined" sx={{ m: 2, mb: 0 }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {browserPermission === 'granted' ? (
                    <NotificationsActiveIcon color="success" />
                  ) : (
                    <NotificationsOffIcon color="error" />
                  )}
                  <Typography variant="body2">
                    {browserPermission === 'granted' 
                      ? 'Браузерные уведомления включены' 
                      : 'Браузерные уведомления отключены'
                    }
                  </Typography>
                </Box>
                {browserPermission !== 'granted' && (
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={requestPermission}
                  >
                    Включить
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Действия */}
          {(notifications || []).length > 0 && (
            <Box sx={{ p: 2, pb: 1 }}>
              <Stack direction="row" spacing={1}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Отметить все как прочитанные
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error" 
                  onClick={clearAllNotifications}
                >
                  Очистить все
                </Button>
              </Stack>
            </Box>
          )}

          {/* Список уведомлений */}
          {(notifications || []).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotificationsOffIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Нет уведомлений
              </Typography>
              <Typography color="text.secondary">
                Новые уведомления появятся здесь
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon>
                      <Box sx={{ 
                        color: getNotificationColor(notification.type),
                        opacity: notification.read ? 0.6 : 1,
                      }}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: notification.read ? 400 : 600,
                              flex: 1,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: 'primary.main' 
                            }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        {!notification.read && (
                          <Button 
                            size="small" 
                            onClick={() => markAsRead(notification.id)}
                          >
                            Прочитано
                          </Button>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < (notifications || []).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Настройки уведомлений */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Настройки уведомлений</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {NOTIFICATION_TYPES.map(type => (
              <Box key={type.key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings[type.key] || false}
                      onChange={(e) => handleSettingChange(type.key, e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {type.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для сообщений */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationsManager; 