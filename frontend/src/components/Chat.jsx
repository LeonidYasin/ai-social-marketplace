import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Badge,
  Drawer,
  AppBar,
  Toolbar,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';

const Chat = ({ currentUser, isOpen, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const messagesEndRef = useRef(null);

  // Подключение к WebSocket
  useEffect(() => {
    if (currentUser && isOpen) {
      const newSocket = io('http://localhost:8000');
      setSocket(newSocket);

      // Присоединяемся к чату
      newSocket.emit('join', {
        userId: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatar_url
      });

      // Слушаем события
      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users.filter(user => user.userId !== currentUser.id));
      });

      newSocket.on('userJoined', (user) => {
        if (user.userId !== currentUser.id) {
          setOnlineUsers(prev => [...prev, user]);
        }
      });

      newSocket.on('userLeft', (user) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
      });

      newSocket.on('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('messageSent', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [currentUser, isOpen]);

  // Загрузка диалогов
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Загрузка сообщений при выборе пользователя
  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages(selectedUser.userId);
    }
  }, [selectedUser, currentUser]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedUser && socket) {
      socket.emit('sendMessage', {
        receiverId: selectedUser.userId,
        content: newMessage,
        senderId: currentUser.id,
        senderUsername: currentUser.username
      });
      setNewMessage('');
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setMessages([]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: { width: 400 }
      }}
    >
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Чат
          </Typography>
          <IconButton color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Список пользователей */}
        <Box sx={{ width: '50%', borderRight: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Онлайн ({onlineUsers.length})
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {onlineUsers.map((user) => (
              <ListItem
                key={user.userId}
                button
                selected={selectedUser?.userId === user.userId}
                onClick={() => handleUserSelect(user)}
                sx={{ py: 1 }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <CircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
                    }
                  >
                    <Avatar src={user.avatarUrl} alt={user.username}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  secondary={
                    <Chip
                      label="Онлайн"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  }
                />
              </ListItem>
            ))}
          </List>

          <Divider />
          
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Диалоги ({conversations.length})
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {conversations.map((conv) => (
              <ListItem
                key={conv.other_user_id}
                button
                selected={selectedUser?.userId === conv.other_user_id}
                onClick={() => handleUserSelect({
                  userId: conv.other_user_id,
                  username: conv.other_username,
                  avatarUrl: conv.other_avatar_url
                })}
                sx={{ py: 1 }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      isUserOnline(conv.other_user_id) ? (
                        <CircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
                      ) : null
                    }
                  >
                    <Avatar src={conv.other_avatar_url} alt={conv.other_username}>
                      {conv.other_username.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={conv.other_username}
                  secondary={
                    <Box>
                      <Typography variant="body2" noWrap>
                        {conv.last_message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(conv.last_message_time)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Область чата */}
        <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
          {selectedUser ? (
            <>
              {/* Заголовок чата */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      isUserOnline(selectedUser.userId) ? (
                        <CircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
                      ) : null
                    }
                  >
                    <Avatar src={selectedUser.avatarUrl} alt={selectedUser.username}>
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle1">
                      {selectedUser.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isUserOnline(selectedUser.userId) ? 'Онлайн' : 'Офлайн'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Сообщения */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.sender_id === currentUser.id ? 'flex-end' : 'flex-start',
                      mb: 1
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1,
                        maxWidth: '70%',
                        backgroundColor: message.sender_id === currentUser.id ? 'primary.main' : 'grey.100',
                        color: message.sender_id === currentUser.id ? 'white' : 'text.primary'
                      }}
                    >
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {formatTime(message.created_at)}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Поле ввода */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <IconButton
                    color="primary"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                Выберите пользователя для начала чата
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Chat; 