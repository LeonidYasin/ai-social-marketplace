import React, { useEffect, useState } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';

const MessageNotifications = ({ currentUser, socket }) => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  // Загрузка истории уведомлений через API
  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      // eslint-disable-next-line
      console.error('Ошибка загрузки уведомлений:', e);
    } finally {
      setLoading(false);
    }
  };

  // Подтверждение доставки уведомления
  const ackDelivered = (notificationId) => {
    if (socket && notificationId) {
      socket.emit('notificationDelivered', { notificationId });
    }
  };

  // Подтверждение прочтения уведомления
  const ackRead = (notificationId) => {
    if (socket && notificationId) {
      socket.emit('notificationRead', { notificationId });
    }
  };

  // Подписка на события WebSocket
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Новое уведомление
    const onNewNotification = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      ackDelivered(notif.id);
    };
    // Массив непрочитанных
    const onUnreadNotifications = (notifs) => {
      setNotifications(prev => {
        // Добавляем только новые
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifs = notifs.filter(n => !existingIds.has(n.id));
        newNotifs.forEach(n => ackDelivered(n.id));
        return [...newNotifs, ...prev];
      });
    };
    // Массив недоставленных
    const onUndeliveredNotifications = (notifs) => {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifs = notifs.filter(n => !existingIds.has(n.id));
        newNotifs.forEach(n => ackDelivered(n.id));
        return [...newNotifs, ...prev];
      });
    };

    socket.on('newNotification', onNewNotification);
    socket.on('unreadNotifications', onUnreadNotifications);
    socket.on('undeliveredNotifications', onUndeliveredNotifications);

    // Загрузка истории при подключении
    fetchNotifications();

    return () => {
      socket.off('newNotification', onNewNotification);
      socket.off('unreadNotifications', onUnreadNotifications);
      socket.off('undeliveredNotifications', onUndeliveredNotifications);
    };
    // eslint-disable-next-line
  }, [socket, currentUser]);

  // Открытие/закрытие поповера
  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    // При открытии — помечаем все как прочитанные
    notifications.forEach(n => {
      if (!n.is_read) ackRead(n.id);
    });
    // Можно также обновить статус через API
  };
  const handleClose = () => setAnchorEl(null);

  // Количество непрочитанных
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen} aria-label="Уведомления" data-testid="notifications-button">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 320, maxWidth: 400 } }}
      >
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {loading ? (
            <ListItem>
              <CircularProgress size={24} />
            </ListItem>
          ) : (notifications || []).length === 0 ? (
            <ListItem>
              <ListItemText primary="Нет уведомлений" />
            </ListItem>
          ) : notifications.map(n => (
            <ListItem key={n.id} selected={!n.is_read} alignItems="flex-start">
              <ListItemText
                primary={n.title || 'Уведомление'}
                secondary={n.message}
              />
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
};

export default MessageNotifications; 