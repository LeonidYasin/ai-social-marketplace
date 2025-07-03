import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import AppBarMain from './components/AppBar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Feed from './components/Feed';
import ChatDialog from './components/ChatDialog';
import Analytics from './components/Analytics';
import SearchDialog from './components/Search';
import NotificationsManager from './components/Notifications';
import Gamification from './components/Gamification';
import UserSettings from './components/UserSettings';
import OAuthSuccess from './components/OAuthSuccess';
import { facebookTheme, neonTheme } from './config/themes';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import useMediaQuery from '@mui/material/useMediaQuery';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// const USERS = [
//   { id: 'ai', name: 'AI Ассистент', isAI: true },
//   { id: 'anna', name: 'Анна', isAI: false },
//   { id: 'ivan', name: 'Иван', isAI: false },
// ];

const App = ({ themeMode, onThemeToggle }) => {
  // Чаты: { userId, messages: [{text, isUser, timestamp}] }
  const [chats, setChats] = useState({
    ai: { userId: 'ai', messages: [ { text: 'Здравствуйте! Чем могу помочь?', isUser: false, timestamp: Date.now() } ] },
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchChat, setSearchChat] = useState('');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [gamificationOpen, setGamificationOpen] = useState(false);
  const [feedData, setFeedData] = useState({ posts: [], userReactions: {}, comments: {} });
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeName, setThemeName] = React.useState(() => localStorage.getItem('theme') || 'facebook');
  const theme = themeName === 'neon' ? neonTheme : facebookTheme;
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);
  
  // Новое состояние для реальных пользователей
  const [realUsers, setRealUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Функция загрузки пользователей из API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('Fetching users from API...');
      
      // Проверяем, есть ли токен авторизации
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, skipping users fetch');
        setRealUsers([]);
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
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
      } else if (response.status === 401) {
        // Токен истек, очищаем данные
        console.log('Token expired, clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setRealUsers([]);
      } else {
        console.error('API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
      
      const response = await fetch('http://localhost:8000/api/auth/me', {
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
      } else if (response.status === 401) {
        // Токен истек
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        return null;
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  };

  // Объединённый список пользователей с пометкой текущего
  const allUsers = useMemo(() => {
    const usersList = [
      // ...USERS, // убрано, чтобы не было демо-пользователей
      ...realUsers
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
      setSettingsOpen(true);
    } else if (currentUser && settingsOpen) {
      // Если пользователь вошел и диалог настроек открыт, закрываем его через небольшую задержку
      setTimeout(() => setSettingsOpen(false), 1000);
    }
  }, [loadingUser, currentUser]);

  // Открыть чат с пользователем
  const openChat = (userId) => {
    if (!chats[userId]) {
      setChats(prev => ({ ...prev, [userId]: { userId, messages: [] } }));
    }
    setActiveChatId(userId);
  };

  // Отправить сообщение
  const sendMessage = (userId, text) => {
    setChats(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        messages: [
          ...prev[userId].messages,
          { text, isUser: true, timestamp: Date.now() },
          // AI-ответ (заглушка)
          ...(userId === 'ai' ? [{ text: 'AI: (заглушка ответа)', isUser: false, timestamp: Date.now() }] : []),
        ],
      },
    }));
  };

  // Функция выхода пользователя
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
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

  // Список чатов для левого сайдбара (фильтрация по поиску)
  const chatList = useMemo(() => {
    return Object.values(chats)
      .map(chat => {
        const user = allUsers.find(u => u.id === chat.userId);
        const lastMsg = chat.messages[chat.messages.length - 1];
        return {
          userId: chat.userId,
          name: user?.name || chat.userId,
          isAI: user?.isAI,
          lastMsg: lastMsg?.text || '',
        };
      })
      .filter(chat =>
        chat.name.toLowerCase().includes(searchChat.toLowerCase()) ||
        chat.lastMsg.toLowerCase().includes(searchChat.toLowerCase())
      );
  }, [chats, searchChat, allUsers]);

  if (loadingUser) return null;

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/" element={
            <Box sx={{ minHeight: '100vh', bgcolor: theme => theme.palette.background.default }}>
              {/* Всегда показываем верхнюю панель */}
              <AppBarMain 
                onAnalyticsOpen={() => setAnalyticsOpen(true)} 
                onSearchOpen={() => setSearchOpen(true)} 
                onNotificationsOpen={() => setNotificationsOpen(true)} 
                onGamificationOpen={() => setGamificationOpen(true)} 
                onUserSettingsOpen={() => setSettingsOpen(true)}
                currentUser={currentUser}
                themeName={themeName}
                setThemeName={setThemeName}
                onLogout={handleLogout}
                onDebugUsers={debugUsers}
              />
              <Box sx={{ display: 'flex' }}>
                <SidebarLeft
                  chatList={chatList}
                  onChatClick={setActiveChatId}
                  searchChat={searchChat}
                  setSearchChat={setSearchChat}
                  open={leftSidebarOpen}
                  onClose={() => setLeftSidebarOpen(false)}
                  variant={isMobile ? 'temporary' : 'permanent'}
                />
                <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, mb: 2, position: 'relative' }}>
                  <Feed
                    onDataUpdate={setFeedData} 
                    currentUser={currentUser}
                    isMobile={isMobile}
                    leftSidebarOpen={leftSidebarOpen}
                    setLeftSidebarOpen={setLeftSidebarOpen}
                    rightSidebarOpen={rightSidebarOpen}
                    setRightSidebarOpen={setRightSidebarOpen}
                  />
                  {activeChatId && (
                    <ChatDialog
                      open={!!activeChatId}
                      onClose={() => setActiveChatId(null)}
                      user={allUsers.find(u => u.id === activeChatId)}
                      messages={chats[activeChatId]?.messages || []}
                      onSend={text => sendMessage(activeChatId, text)}
                    />
                  )}
                </Box>
                <SidebarRight
                  users={allUsers}
                  onUserClick={openChat}
                  open={rightSidebarOpen}
                  onClose={() => setRightSidebarOpen(false)}
                  variant={isMobile ? 'temporary' : 'permanent'}
                  loading={loadingUsers}
                />
              </Box>
              
              {/* Аналитика */}
              <Analytics
                open={analyticsOpen}
                onClose={() => setAnalyticsOpen(false)}
                posts={feedData.posts}
                userReactions={feedData.userReactions}
                comments={feedData.comments}
              />
              
              {/* Поиск */}
              <SearchDialog
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                onSearchResult={(results) => {
                  console.log('Search results:', results);
                  // TODO: Обработать результаты поиска
                }}
              />
              
              {/* Уведомления */}
              <NotificationsManager
                open={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                currentUser={currentUser}
              />
              
              {/* Гамификация */}
              <Gamification
                open={gamificationOpen}
                onClose={() => setGamificationOpen(false)}
                userStats={{
                  totalPosts: feedData.posts.length,
                  totalReactions: Object.values(feedData.userReactions).filter(r => r).length,
                  totalComments: Object.values(feedData.comments).flat().length,
                  totalXP: 450, // TODO: Рассчитывать на основе достижений
                  totalViews: 1234, // TODO: Добавить просмотры
                  soldItems: 2, // TODO: Добавить продажи
                }}
              />
              
              {/* Настройки пользователя и mock-логин */}
              <UserSettings
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onUserChange={(user) => {
                  setCurrentUser(user);
                  // Обновляем список пользователей после изменения пользователя
                  setTimeout(() => fetchUsers(), 1000);
                }}
                posts={feedData.posts}
              />
            </Box>
          } />
        </Routes>
      </ThemeProvider>
    </Router>
  );
};

export default App; 