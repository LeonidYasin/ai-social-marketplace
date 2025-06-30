import React from 'react';
import { AppBar, Toolbar, Box, IconButton, InputBase, Stack, Tooltip, alpha } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ForumIcon from '@mui/icons-material/Forum';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import SellIcon from '@mui/icons-material/Sell';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const sections = [
  { label: 'Главная', icon: <HomeIcon fontSize="large" color="primary" /> },
  { label: 'Трибуна', icon: <ForumIcon fontSize="large" /> },
  { label: 'Видео', icon: <PlayCircleIcon fontSize="large" /> },
  { label: 'Продам', icon: <SellIcon fontSize="large" /> },
  { label: 'Куплю', icon: <ShoppingCartIcon fontSize="large" /> },
  { label: 'Отдам', icon: <VolunteerActivismIcon fontSize="large" /> },
  { label: 'Недвижимость', icon: <HomeWorkIcon fontSize="large" /> },
];

const AppBarMain = () => (
  <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: 1201 }}>
    <Toolbar sx={{ minHeight: 64, justifyContent: 'space-between' }}>
      {/* Логотип слева */}
      <Box sx={{ fontWeight: 700, fontSize: 26, color: 'primary.main', mr: 2, letterSpacing: 1 }}>
        M
      </Box>
      {/* Центр: горизонтальный ряд иконок-разделов */}
      <Stack direction="row" spacing={2} sx={{ flexGrow: 1, justifyContent: 'center' }}>
        {sections.map((section, i) => (
          <Tooltip key={i} title={section.label} arrow placement="bottom">
            <IconButton
              color="default"
              sx={{
                borderRadius: 2,
                bgcolor: 'transparent',
                transition: 'background 0.2s',
                '&:hover': {
                  bgcolor: alpha('#1976d2', 0.08),
                  color: 'primary.main',
                },
                mx: 0.5,
                p: 1.2,
              }}
            >
              {section.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
      {/* Справа: поиск, чаты, профиль */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ position: 'relative', mr: 1 }}>
          <InputBase
            placeholder="Поиск..."
            sx={{ bgcolor: '#f0f2f5', pl: 4, pr: 2, py: 0.5, borderRadius: 2, width: 180 }}
            inputProps={{ 'aria-label': 'search' }}
          />
          <SearchIcon sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'grey.500' }} />
        </Box>
        <Tooltip title="Чаты">
          <IconButton color="default">
            <ChatIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Профиль">
          <IconButton color="default">
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Toolbar>
  </AppBar>
);

export default AppBarMain; 