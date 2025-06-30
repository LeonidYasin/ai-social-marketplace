import React, { useState } from 'react';
import { Box } from '@mui/material';
import AppBarMain from './components/AppBar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Feed from './components/Feed';
import AIChat from './components/AIChat';

const App = () => {
  const [aiChatOpen, setAIChatOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarMain />
      <SidebarLeft onAIChatClick={() => setAIChatOpen(true)} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, mb: 2, position: 'relative' }}>
        <Feed />
        <AIChat open={aiChatOpen} onClose={() => setAIChatOpen(false)} />
      </Box>
      <SidebarRight />
    </Box>
  );
};

export default App; 