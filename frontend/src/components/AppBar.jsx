import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const AppBarMain = () => (
  <AppBar position="fixed">
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Marketplace
      </Typography>
      <Box>
        <Button color="inherit" startIcon={<HomeIcon />}>Главная</Button>
        <Button color="inherit" startIcon={<ChatIcon />}>Чаты</Button>
        <Button color="inherit" startIcon={<AccountCircleIcon />}>Профиль</Button>
      </Box>
    </Toolbar>
  </AppBar>
);

export default AppBarMain; 