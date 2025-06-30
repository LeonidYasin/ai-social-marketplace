import React, { useState } from 'react';
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
  { key: 'home', label: 'Главная', icon: HomeIcon },
  { key: 'tribune', label: 'Трибуна', icon: ForumIcon },
  { key: 'video', label: 'Видео', icon: PlayCircleIcon },
  { key: 'sell', label: 'Продам', icon: SellIcon },
  { key: 'buy', label: 'Куплю', icon: ShoppingCartIcon },
  { key: 'give', label: 'Отдам', icon: VolunteerActivismIcon },
  { key: 'realty', label: 'Недвижимость', icon: HomeWorkIcon },
];

const AppBarMain = () => {
  const [active, setActive] = useState('home');

  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: 1201 }}>
      <Toolbar sx={{ minHeight: 64, justifyContent: 'space-between' }}>
        {/* Логотип слева */}
        <Box sx={{ fontWeight: 700, fontSize: 26, color: 'primary.main', mr: 2, letterSpacing: 1 }}>
          M
        </Box>
        {/* Центр: горизонтальный ряд иконок-разделов */}
        <Stack direction="row" spacing={1.5} sx={{ flexGrow: 1, justifyContent: 'center' }}>
          {sections.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <Tooltip key={key} title={label} arrow placement="bottom">
                <IconButton
                  onClick={() => setActive(key)}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'common.white' : 'grey.700',
                    transition: 'background 0.2s, color 0.2s',
                    boxShadow: isActive ? 2 : 0,
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : alpha('#1976d2', 0.08),
                      color: isActive ? 'common.white' : 'primary.main',
                    },
                  }}
                >
                  <Icon fontSize="medium" />
                </IconButton>
              </Tooltip>
            );
          })}
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
};

export default AppBarMain; 