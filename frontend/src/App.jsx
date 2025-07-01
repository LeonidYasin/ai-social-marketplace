import React, { useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import AppBarMain from './components/AppBar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Feed from './components/Feed';
import ChatDialog from './components/ChatDialog';
import Analytics from './components/Analytics';
import SearchDialog from './components/Search';
import NotificationsManager from './components/Notifications';
import Gamification from './components/Gamification';

const USERS = [
  { id: 'ai', name: 'AI Ассистент', isAI: true },
  { id: 'anna', name: 'Анна', isAI: false },
  { id: 'ivan', name: 'Иван', isAI: false },
  { id: 'petr', name: 'Петр', isAI: false },
];

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

  // Список чатов для левого сайдбара (фильтрация по поиску)
  const chatList = useMemo(() => {
    return Object.values(chats)
      .map(chat => {
        const user = USERS.find(u => u.id === chat.userId);
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
  }, [chats, searchChat]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      <Box sx={{ display: 'flex' }}>
        <AppBarMain 
          onAnalyticsOpen={() => setAnalyticsOpen(true)} 
          onSearchOpen={() => setSearchOpen(true)} 
          onNotificationsOpen={() => setNotificationsOpen(true)} 
          onGamificationOpen={() => setGamificationOpen(true)} 
        />
        <SidebarLeft
          chatList={chatList}
          onChatClick={setActiveChatId}
          searchChat={searchChat}
          setSearchChat={setSearchChat}
        />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, mb: 2, position: 'relative' }}>
          <Feed onDataUpdate={setFeedData} />
          {activeChatId && (
            <ChatDialog
              open={!!activeChatId}
              onClose={() => setActiveChatId(null)}
              user={USERS.find(u => u.id === activeChatId)}
              messages={chats[activeChatId]?.messages || []}
              onSend={text => sendMessage(activeChatId, text)}
            />
          )}
        </Box>
        <SidebarRight
          users={USERS}
          onUserClick={openChat}
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
    </Box>
  );
};

export default App; 