import React from 'react';
import { Box, Toolbar } from '@mui/material';
import AppBarMain from './components/AppBar';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import Feed from './components/Feed';
import AIChat from './components/AIChat';

const App = () => (
  <Box sx={{ display: 'flex' }}>
    <AppBarMain />
    <SidebarLeft />
    <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, mb: 2 }}>
      <Feed />
    </Box>
    <SidebarRight />
    <AIChat />
  </Box>
);

export default App; 