import React, { useState } from 'react';
import { AppBar, Toolbar, Box, IconButton, InputBase, Stack, Tooltip, alpha, Badge, Menu, MenuItem, ListItemIcon, ListItemText, useTheme } from '@mui/material';
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SearchDialog from './Search';
import NotificationsManager from './Notifications';
import Gamification from './Gamification';
import Avatar from '@mui/material/Avatar';

const sections = [
  { key: 'home', label: 'Главная', icon: HomeIcon },
  { key: 'tribune', label: 'Трибуна', icon: ForumIcon },
  { key: 'video', label: 'Видео', icon: PlayCircleIcon },
  { key: 'sell', label: 'Продам', icon: SellIcon },
  { key: 'buy', label: 'Куплю', icon: ShoppingCartIcon },
  { key: 'give', label: 'Отдам', icon: VolunteerActivismIcon },
  { key: 'realty', label: 'Недвижимость', icon: HomeWorkIcon },
];

const notifications = [
  { id: 1, text: 'Новое сообщение от Анны' },
  { id: 2, text: 'AI Ассистент ответил на ваш вопрос' },
  { id: 3, text: 'Появился новый пост в "Продам"' },
];

const AppBarMain = ({ onAnalyticsOpen, onSearchOpen, onNotificationsOpen, onGamificationOpen, onUserSettingsOpen, currentUser }) => {
  const theme = useTheme();
  const [active, setActive] = useState('home');
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [unread, setUnread] = useState(notifications.length);

  const handleNotifClick = (event) => {
    setNotifAnchor(event.currentTarget);
    setUnread(0);
  };
  const handleNotifClose = () => setNotifAnchor(null);

  const handleMenuClick = (event) => setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

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
        {/* Справа: поиск, чаты, уведомления, профиль, меню */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ position: 'relative', mr: 1 }}>
            <InputBase
              placeholder="Поиск..."
              onClick={onSearchOpen}
              sx={{ 
                bgcolor: '#f0f2f5', 
                pl: 4, 
                pr: 2, 
                py: 0.5, 
                borderRadius: 2, 
                width: 180,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: '#e4e6eb',
                }
              }}
              inputProps={{ 
                'aria-label': 'search',
                readOnly: true,
              }}
            />
            <SearchIcon sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'grey.500' }} />
          </Box>
          <Tooltip title="Чаты">
            <IconButton color="default">
              <ChatIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Аналитика">
            <IconButton color="default" onClick={onAnalyticsOpen}>
              <TrendingUpIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Уведомления">
            <IconButton color="default" onClick={onNotificationsOpen}>
              <Badge color="error" badgeContent={unread} invisible={unread === 0}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={theme.palette.mode === 'light' ? 'Темная тема' : 'Светлая тема'}>
            <IconButton 
              color="default" 
              onClick={() => window.toggleTheme()}
              sx={{
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'rotate(180deg)',
                }
              }}
            >
              {theme.palette.mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={handleNotifClose} PaperProps={{ sx: { mt: 1, borderRadius: 2 } }}>
            {notifications.length === 0 ? (
              <MenuItem disabled>Нет новых уведомлений</MenuItem>
            ) : (
              notifications.map(n => (
                <MenuItem key={n.id} onClick={handleNotifClose}>{n.text}</MenuItem>
              ))
            )}
          </Menu>
          <Tooltip title={currentUser && currentUser.name ? currentUser.name : 'Войти'}>
            <IconButton color="default" onClick={onUserSettingsOpen}>
              {currentUser && currentUser.name ? (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 18 }} src={currentUser.avatar}>
                  {currentUser.name[0]}
                </Avatar>
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Меню">
            <IconButton color="default" onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={handleMenuClose} PaperProps={{ sx: { mt: 1, borderRadius: 2 } }}>
            <MenuItem onClick={onGamificationOpen}>
              <ListItemIcon><EmojiEventsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Гамификация" />
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Настройки" />
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Выйти" />
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AppBarMain; 