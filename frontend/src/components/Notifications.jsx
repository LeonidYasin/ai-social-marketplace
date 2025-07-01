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

const NotificationsManager = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [browserPermission, setBrowserPermission] = useState('default');
  const [showSettings, setShowSettings] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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
  };

  // Отметить все как прочитанные
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Удалить уведомление
  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  // Очистить все уведомления
  const clearAllNotifications = () => {
    setNotifications([]);
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
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
            <IconButton onClick={onClose}>
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
          {notifications.length > 0 && (
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
          {notifications.length === 0 ? (
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
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notification.time}
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
                  {index < notifications.length - 1 && <Divider />}
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
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationsManager; 