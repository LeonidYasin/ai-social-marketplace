import logger from './services/logging';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Box, Typography, ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import { io } from 'socket.io-client';
import AppBarMain from './components/AppBar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Feed from './components/Feed';
import Analytics from './components/Analytics';
import SearchDialog from './components/Search';
import NotificationsManager from './components/Notifications';
import Gamification from './components/Gamification';
import UserSettings from './components/UserSettings';
import OAuthSuccess from './components/OAuthSuccess';
import AdminPanel from './components/AdminPanel';
import SettingsPage from './components/SettingsPage';
import AnalyticsPage from './components/AnalyticsPage';
import NotificationsPage from './components/NotificationsPage';
import GamificationPage from './components/GamificationPage';
import AdminPage from './components/AdminPage';
import { facebookTheme, neonTheme } from './config/themes';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PeopleIcon from '@mui/icons-material/People';
import useMediaQuery from '@mui/material/useMediaQuery';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import { authAPI } from './services/api';
import API_CONFIG from './config/api';
import Chat from './components/Chat';
import CreatePostPage from './components/CreatePostPage';
import ProfilePage from './components/ProfilePage';

// const USERS = [
//   { id: 'ai', name: 'AI Ассистент', isAI: true },
//   { id: 'anna', name: 'Анна', isAI: false },
//   { id: 'ivan', name: 'Иван', isAI: false },
// ];

function MainLayout({
  chatList,
  openChat,
  searchChat,
  setSearchChat,
  leftSidebarOpen,
  setLeftSidebarOpen,
  rightSidebarOpen,
  setRightSidebarOpen,
  isMobile,
  allUsers,
  loadingUsers,
  currentUser,
  themeName,
  setThemeName,
  debugUsers,
  socket,
  feedData,
  setFeedData,
  setCurrentUser,
  fetchUsers,
  aiChatOpen,
  setAiChatOpen,
  openAIChat,
  showPresentation,
  onShowPresentation,
  onHidePresentation,
}) {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme => theme.palette.background.default }}>
      <AppBarMain
        onAnalyticsOpen={() => navigate('/analytics')}
        onSearchOpen={() => navigate('/search')}
        onNotificationsOpen={() => navigate('/notifications')}
        onGamificationOpen={() => navigate('/gamification')}
        onUserSettingsOpen={() => navigate('/settings')}
        onAdminPanelOpen={() => navigate('/admin')}
        currentUser={currentUser}
        themeName={themeName}
        setThemeName={setThemeName}
        onDebugUsers={debugUsers}
        socket={socket}
        setLeftSidebarOpen={setLeftSidebarOpen}
        setRightSidebarOpen={setRightSidebarOpen}
        onShowPresentation={onShowPresentation}
      />
      <Box sx={{ display: 'flex' }}>
        <SidebarLeft
          chatList={chatList}
          onChatClick={openChat}
          searchChat={searchChat}
          setSearchChat={setSearchChat}
          open={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          variant={leftSidebarOpen ? "permanent" : "temporary"}
          onAIChatClick={openAIChat}
        />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, mb: 2, position: 'relative' }}>
          <Outlet context={{
            showPresentation,
            onHidePresentation
          }} />
        </Box>
        <SidebarRight
          users={allUsers}
          onUserClick={openChat}
          open={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          variant={rightSidebarOpen ? "permanent" : "temporary"}
          loading={loadingUsers}
          onAIChatClick={openAIChat}
        />
      </Box>

    </Box>
  );
}

const AppWithRouter = (props) => {
  const navigate = useNavigate();
  
  // Обработка навигации при отсутствии пользователя
  useEffect(() => {
    // Перенаправляем на settings только если:
    // 1. Загрузка завершена
    // 2. Пользователь не авторизован
    // 3. Нет токена в localStorage
    // 4. Мы не находимся уже на странице settings
    // 5. Мы не находимся на главной странице (чтобы не перенаправлять обратно)
    if (
      !props.loadingUser && 
      !props.currentUser && 
      !localStorage.getItem('authToken') &&
      window.location.pathname !== '/settings' &&
      window.location.pathname !== '/'
    ) {
      navigate('/settings');
    }
  }, [props.loadingUser, props.currentUser, navigate]);
  
  const openChat = (userId) => {
    navigate(`/chat/${userId}`);
  };

  // Список чатов для левого сайдбара (фильтрация по поиску)
  const chatList = useMemo(() => {
    return Object.values(props.chats || {})
      .map(chat => {
        const user = props.allUsers.find(u => u.id === chat.userId);
        const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
        return {
          userId: chat.userId,
          name: user?.name || chat.userId,
          isAI: user?.isAI,
          lastMsg: lastMsg?.text || '',
        };
      })
      .filter(chat =>
        chat.name.toLowerCase().includes((props.searchChat || '').toLowerCase()) ||
        chat.lastMsg.toLowerCase().includes((props.searchChat || '').toLowerCase())
      );
  }, [props.chats, props.searchChat, props.allUsers]);

  if (props.loadingUser) return null;

  return (
    <Routes>
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      <Route path="/post/new" element={<CreatePostPage currentUser={props.currentUser} />} />
      <Route path="/" element={
        <MainLayout
          chatList={chatList}
          openChat={openChat}
          searchChat={props.searchChat}
          setSearchChat={props.setSearchChat}
          leftSidebarOpen={props.leftSidebarOpen}
          setLeftSidebarOpen={props.setLeftSidebarOpen}
          rightSidebarOpen={props.rightSidebarOpen}
          setRightSidebarOpen={props.setRightSidebarOpen}
          isMobile={props.isMobile}
          allUsers={props.allUsers}
          loadingUsers={props.loadingUsers}
          currentUser={props.currentUser}
          themeName={props.themeName}
          setThemeName={props.setThemeName}
          debugUsers={props.debugUsers}
          socket={props.socket}
          feedData={props.feedData}
          setFeedData={props.setFeedData}
          setCurrentUser={props.setCurrentUser}
          fetchUsers={props.fetchUsers}
          aiChatOpen={props.aiChatOpen}
          setAiChatOpen={props.setAiChatOpen}
          openAIChat={props.openAIChat}
          showPresentation={props.showPresentation}
          onShowPresentation={props.onShowPresentation}
          onHidePresentation={props.onHidePresentation}
        />
      }>
        <Route index element={<Feed
          onDataUpdate={props.setFeedData}
          currentUser={props.currentUser}
          isMobile={props.isMobile}
          leftSidebarOpen={props.leftSidebarOpen}
          setLeftSidebarOpen={props.setLeftSidebarOpen}
          rightSidebarOpen={props.rightSidebarOpen}
          setRightSidebarOpen={props.setRightSidebarOpen}
          aiChatOpen={props.aiChatOpen}
          setAiChatOpen={props.setAiChatOpen}
        />} />
        <Route path="chat/:id" element={<Chat currentUser={props.currentUser} />} />
        <Route path="/settings" element={<SettingsPage 
          currentUser={props.currentUser}
          setCurrentUser={props.setCurrentUser}
          fetchUsers={props.fetchUsers}
          posts={props.feedData.posts}
        />} />
        <Route path="analytics" element={<AnalyticsPage 
          posts={props.feedData.posts}
          userReactions={props.feedData.userReactions}
          comments={props.feedData.comments}
        />} />
        <Route path="notifications" element={<NotificationsPage 
          currentUser={props.currentUser}
        />} />
        <Route path="gamification" element={<GamificationPage 
        userStats={{
            totalPosts: props.feedData.posts?.length || 0,
            totalReactions: Object.values(props.feedData.userReactions || {}).filter(r => r).length,
            totalComments: Object.values(props.feedData.comments || {}).flat().length,
          totalXP: 450,
          totalViews: 1234,
          soldItems: 2,
        }}
        />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="profile" element={<ProfilePage currentUser={props.currentUser} onLogout={props.handleLogout || (() => { localStorage.clear(); window.location.reload(); })} />} />
      </Route>
    </Routes>
  );
};

const App = ({ themeMode, onThemeToggle }) => {
  // Чаты: { userId, messages: [{text, isUser, timestamp}] }
  const [chats, setChats] = useState({
    ai: { userId: 'ai', messages: [ { text: 'Здравствуйте! Чем могу помочь?', isUser: false, timestamp: Date.now() } ] },
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchChat, setSearchChat] = useState('');
  const [feedData, setFeedData] = useState({ posts: [], userReactions: {}, comments: {} });
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [themeName, setThemeName] = React.useState(() => localStorage.getItem('theme') || 'facebook');
  const theme = themeName === 'neon' ? neonTheme : facebookTheme;
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Состояние для управления AI-ассистентом
  const [aiChatOpen, setAiChatOpen] = useState(false);
  
  // Новое состояние для реальных пользователей
  const [realUsers, setRealUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // WebSocket соединение
  const [socket, setSocket] = useState(null);
  
  // Mobile detection
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'));

  // Глобальный state для презентации
  const [showPresentation, setShowPresentation] = useState(false);
  const togglePresentation = () => setShowPresentation(v => !v);

  const failedUserFetchAttempts = useRef(0);
  const MAX_USER_FETCH_ATTEMPTS = 3;
  const shownConnectionErrorRef = useRef(false);

  // Функция загрузки пользователей из API
  const fetchUsers = async () => {
    if (failedUserFetchAttempts.current >= MAX_USER_FETCH_ATTEMPTS) {
      setLoadingUsers(false);
      return;
    }
    try {
      setLoadingUsers(true);
      
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USERS), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Преобразуем пользователей в нужный формат
        const formattedUsers = data.map(user => ({
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`.trim() || user.username,
          username: user.username,
          email: user.email,
          avatar: user.avatar_url || '',
          isRealUser: true,
          isAI: false
        }));
        // Удаляем дубликаты по username
        const uniqueUsers = [];
        const seen = new Set();
        for (const user of formattedUsers) {
          if (!seen.has(user.username)) {
            uniqueUsers.push(user);
            seen.add(user.username);
          }
        }
        setRealUsers(uniqueUsers);
        failedUserFetchAttempts.current = 0;
        shownConnectionErrorRef.current = false;
      } else {
        console.error('API error fetching users:', response.status, response.statusText);
        // При ошибке API устанавливаем пустой массив пользователей
        setRealUsers([]);
        failedUserFetchAttempts.current++;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // При ошибке сети устанавливаем пустой массив пользователей
      setRealUsers([]);
      failedUserFetchAttempts.current++;
      if (failedUserFetchAttempts.current === MAX_USER_FETCH_ATTEMPTS && !shownConnectionErrorRef.current) {
        shownConnectionErrorRef.current = true;
        alert('Сервер недоступен. Проверьте подключение и перезагрузите страницу позже.');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // Функция для загрузки текущего пользователя по токену
  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found');
        return null;
      }
      
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.AUTH_ME), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const user = {
          id: userData.id,
          name: `${userData.first_name} ${userData.last_name}`.trim() || userData.username,
          email: userData.email,
          username: userData.username,
          avatar: userData.avatar_url || '',
          createdAt: userData.created_at,
          authMethod: 'token'
        };
        
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      } else if (response.status === 401 || response.status === 404) {
        // Токен истек или пользователь не найден - очищаем все данные
        console.log('Token expired or user not found, clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('guestUser');
        return null;
      } else {
        // Другие ошибки - тоже очищаем данные для безопасности
        console.log('Unexpected error loading user, clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('guestUser');
        return null;
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      // При любой ошибке сети очищаем данные
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('guestUser');
      return null;
    }
  };

  // Объединённый список пользователей с пометкой текущего
  const allUsers = useMemo(() => {
    const usersList = [
      // ...USERS, // убрано, чтобы не было демо-пользователей
      ...(realUsers || [])
    ];

    // Проверяем, есть ли текущий пользователь в списке
    const currentUserInList = currentUser && usersList.find(u =>
      (u.id && u.id === currentUser.id) ||
      (u.username && u.username === currentUser.username)
    );

    // Если нет — добавляем текущего пользователя
    if (currentUser && !currentUserInList) {
      usersList.push({
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        email: currentUser.email,
        avatar: currentUser.avatar || '',
        isRealUser: true,
        isAI: false
      });
    }

    // Помечаем только одного пользователя как isMe
    return usersList.map(u => ({
      ...u,
      isMe: currentUser &&
        ((u.id && u.id === currentUser.id) ||
         (u.username && u.username === currentUser.username))
    }));
  }, [realUsers, currentUser]);

  React.useEffect(() => {
    localStorage.setItem('theme', themeName);
  }, [themeName]);

  // Загружаем пользователей при монтировании компонента
  useEffect(() => {
    fetchUsers();
  }, []);

  // Периодическое обновление сообщений в активном чате
  useEffect(() => {
    if (!activeChatId || !currentUser) return;

    const interval = setInterval(async () => {
      await loadConversation(activeChatId);
    }, 3000); // Обновляем каждые 3 секунды

    return () => clearInterval(interval);
  }, [activeChatId, currentUser]);

  // Инициализация WebSocket соединения
  useEffect(() => {
    console.log('App.jsx: Инициализация WebSocket для пользователя:', currentUser);
    
    if (currentUser) {
      const newSocket = io(API_CONFIG.getWsUrl(), {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });
      
      newSocket.on('connect', () => {
        console.log('App.jsx: WebSocket подключен, socket.id:', newSocket.id);
        
        // Присоединяемся к чату
        newSocket.emit('join', {
          userId: currentUser.id,
          username: currentUser.username,
          avatarUrl: currentUser.avatar
        });
        console.log('App.jsx: Отправлен join с данными:', {
          userId: currentUser.id,
          username: currentUser.username
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('App.jsx: WebSocket отключен, причина:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('App.jsx: Ошибка подключения WebSocket:', error);
        console.log('App.jsx: Попытка переподключения...');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('App.jsx: WebSocket переподключен, попытка:', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('App.jsx: Ошибка переподключения WebSocket:', error);
      });

      // Проверяем состояние подключения через 2 секунды
      setTimeout(() => {
        if (!newSocket.connected) {
          console.warn('App.jsx: WebSocket не подключился за 2 секунды (это нормально для разработки)');
          console.log('App.jsx: Состояние socket:', {
            connected: newSocket.connected,
            id: newSocket.id,
            transport: newSocket.io.engine.transport.name
          });
        }
      }, 2000);

      setSocket(newSocket);

      return () => {
        console.log('App.jsx: Отключение WebSocket');
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        console.log('App.jsx: Отключение WebSocket (пользователь не авторизован)');
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [currentUser]);

  // Обновляем список пользователей после изменения currentUser
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    const initializeUser = async () => {
      console.log('Initializing user...');
      
      // Сначала пытаемся загрузить пользователя по токену
      const tokenUser = await loadCurrentUser();
      if (tokenUser) {
        console.log('User loaded from token:', tokenUser);
        setLoadingUser(false);
        return;
      }
      
      // Если нет токена, проверяем localStorage
      const saved = localStorage.getItem('currentUser');
      console.log('LOADING USER FROM STORAGE:', saved);
      
      if (saved) {
        const savedUser = JSON.parse(saved);
        // Проверяем, есть ли токен для этого пользователя
        const token = localStorage.getItem('authToken');
        if (!token) {
          // Нет токена - пользователь не авторизован
          console.log('No token found, clearing saved user');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        } else {
          setCurrentUser(savedUser);
        }
      } else {
        // Нет сохраненного пользователя - показываем экран входа
        console.log('No saved user found');
        setCurrentUser(null);
      }
      
      setLoadingUser(false);
    };
    
    initializeUser();
  }, []);

  useEffect(() => {
    console.log('CURRENT USER CHANGED:', currentUser);
    if (!loadingUser && !currentUser) {
      // Перенаправляем на страницу настроек вместо открытия модального окна
      // Навигация будет обработана в AppWithRouter
    }
  }, [loadingUser, currentUser]);

  // Отправить сообщение
  const sendMessage = async (userId, text) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      // Отправляем сообщение на сервер
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.MESSAGES_SEND), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: userId,
          content: text
        })
      });

      if (response.ok) {
        // Добавляем сообщение локально для мгновенного отображения
        setChats(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            messages: [
              ...prev[userId].messages,
              { text, isUser: true, timestamp: Date.now() }
            ],
          },
        }));

        // Загружаем обновленную историю сообщений
        await loadConversation(userId);
      } else {
        console.error('Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Загрузить историю сообщений с пользователем
  const loadConversation = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.MESSAGES_CONVERSATION(userId)), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const messages = await response.json();
        
        // Преобразуем сообщения в нужный формат
        const formattedMessages = messages.map(msg => ({
          text: msg.content,
          isUser: msg.sender_id === currentUser?.id,
          timestamp: new Date(msg.created_at).getTime()
        }));

        setChats(prev => ({
          ...prev,
          [userId]: {
            userId,
            messages: formattedMessages
          },
        }));
      } else {
        console.error('Failed to load conversation:', response.status);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Функция выхода пользователя
  const handleLogout = () => {
    // Используем функцию из API для правильного выхода
    authAPI.logout();
    setCurrentUser(null);
    // Перенаправление будет обработано в AppWithRouter
  };

  // Функция для отладки пользователей
  const debugUsers = () => {
    console.log('=== DEBUG USERS ===');
    console.log('Current user:', currentUser);
    console.log('Real users from API:', realUsers);
    console.log('All users:', allUsers);
    console.log('Users with isMe flag:', allUsers.filter(u => u.isMe));
    console.log('==================');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppWithRouter
        chats={chats}
        setChats={setChats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        searchChat={searchChat}
        setSearchChat={setSearchChat}
        feedData={feedData}
        setFeedData={setFeedData}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        loadingUser={loadingUser}
        setLoadingUser={setLoadingUser}
        themeName={themeName}
        setThemeName={setThemeName}
        isMobile={isMobile}
        leftSidebarOpen={leftSidebarOpen}
        setLeftSidebarOpen={setLeftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
        setRightSidebarOpen={setRightSidebarOpen}
        allUsers={allUsers}
        loadingUsers={loadingUsers}
        debugUsers={debugUsers}
        socket={socket}
        fetchUsers={fetchUsers}
        aiChatOpen={aiChatOpen}
        setAiChatOpen={setAiChatOpen}
        openAIChat={() => setAiChatOpen(true)}
        showPresentation={showPresentation}
        onShowPresentation={togglePresentation}
        onHidePresentation={() => setShowPresentation(false)}
      />
    </ThemeProvider>
  );
};

export default App; 