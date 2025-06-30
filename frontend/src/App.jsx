import React, { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import AppBarMain from './components/AppBar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Feed from './components/Feed';
import ChatDialog from './components/ChatDialog';

const USERS = [
  { id: 'ai', name: 'AI Ассистент', isAI: true },
  { id: 'anna', name: 'Анна', isAI: false },
  { id: 'ivan', name: 'Иван', isAI: false },
  { id: 'petr', name: 'Петр', isAI: false },
];

const App = () => {
  // Чаты: { userId, messages: [{text, isUser, timestamp}] }
  const [chats, setChats] = useState({
    ai: { userId: 'ai', messages: [ { text: 'Здравствуйте! Чем могу помочь?', isUser: false, timestamp: Date.now() } ] },
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchChat, setSearchChat] = useState('');

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
        <AppBarMain />
        <SidebarLeft
          chatList={chatList}
          onChatClick={setActiveChatId}
          searchChat={searchChat}
          setSearchChat={setSearchChat}
        />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, mb: 2, position: 'relative' }}>
          <Feed />
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
    </Box>
  );
};

export default App; 