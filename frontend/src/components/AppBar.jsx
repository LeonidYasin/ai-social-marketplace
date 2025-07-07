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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NightlightIcon from '@mui/icons-material/Nightlight';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SearchDialog from './Search';
import NotificationsManager from './Notifications';
import MessageNotifications from './MessageNotifications';
import Gamification from './Gamification';
import Avatar from '@mui/material/Avatar';
import { setThemeName } from '../App';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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

const AppBarMain = ({ onAnalyticsOpen, onSearchOpen, onNotificationsOpen, onGamificationOpen, onUserSettingsOpen, onAdminPanelOpen, currentUser, themeName, setThemeName, onDebugUsers, socket }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [active, setActive] = useState('home');
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [unread, setUnread] = useState(notifications.length);
  const [anchorEl, setAnchorEl] = useState(null);
  const [moreAnchor, setMoreAnchor] = useState(null);

  // Мобильная логика: показываем Home, активную вкладку (если не Home), остальные — в меню
  let visibleSections = [{ key: 'home', label: 'Главная', icon: HomeIcon }];
  let hiddenSections = sections.filter(s => s.key !== 'home');
  if (isMobile) {
    if (active !== 'home') {
      const activeSection = sections.find(s => s.key === active);
      if (activeSection && activeSection.key !== 'home') {
        visibleSections.push(activeSection);
        hiddenSections = hiddenSections.filter(s => s.key !== activeSection.key);
      }
    }
  } else {
    visibleSections = sections;
    hiddenSections = [];
  }

  const handleNotifClick = (event) => {
    setNotifAnchor(event.currentTarget);
    setUnread(0);
  };
  const handleNotifClose = () => setNotifAnchor(null);

  const handleMenuClick = (event) => setMenuAnchor(event.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  const handleThemeMenu = (event) => setAnchorEl(event.currentTarget);
  const handleThemeChange = (theme) => {
    setThemeName(theme);
    setAnchorEl(null);
  };

  const handleMoreMenu = (event) => setMoreAnchor(event.currentTarget);
  const handleMoreClose = () => setMoreAnchor(null);

  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: 1201 }}>
      <Toolbar sx={{ minHeight: 64, justifyContent: 'space-between', px: isMobile ? 1 : 2, position: 'relative' }}>
        <Box sx={{ fontWeight: 700, fontSize: 24, color: 'primary.main', letterSpacing: 1, zIndex: 2 }}>
          M
        </Box>
        <Stack
          direction="row"
          spacing={isMobile ? 0.5 : 1.5}
          alignItems="center"
          sx={
            isMobile
              ? { ml: 2, zIndex: 2 }
              : {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  margin: 'auto',
                  width: 'fit-content',
                  justifyContent: 'center',
                  zIndex: 1,
                }
          }
        >
          {visibleSections.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <Tooltip key={key} title={label} arrow placement="bottom">
                <IconButton
                  onClick={() => setActive(key)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'common.white' : 'grey.700',
                    transition: 'background 0.2s, color 0.2s',
                    boxShadow: isActive ? 2 : 0,
                    flex: '0 0 auto',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'grey.100',
                      color: isActive ? 'common.white' : 'primary.main',
                    },
                  }}
                >
                  <Icon fontSize="medium" />
                </IconButton>
              </Tooltip>
            );
          })}
          {isMobile && hiddenSections.length > 0 && (
            <>
              <Tooltip title="Ещё">
                <IconButton onClick={handleMoreMenu}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={handleMoreClose}>
                {hiddenSections.map(({ key, label, icon: Icon }) => (
                  <MenuItem key={key} onClick={() => { setActive(key); handleMoreClose(); }}>
                    <ListItemIcon><Icon /></ListItemIcon>
                    <ListItemText primary={label} />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 'auto', flexShrink: 0 }}>
          <Tooltip title="Поиск">
            <IconButton color="default" onClick={onSearchOpen}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <MessageNotifications socket={socket} currentUser={currentUser} />
          <Tooltip title="Сменить стиль">
            <IconButton color="inherit" onClick={handleThemeMenu}>
              <LightModeIcon sx={{ display: themeName === 'facebook' ? 'inline' : 'none' }} />
              <NightlightIcon sx={{ display: themeName === 'neon' ? 'inline' : 'none' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Админская панель">
            <IconButton color="default" onClick={onAdminPanelOpen}>
              <AdminPanelSettingsIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => handleThemeChange('facebook')}>Facebook стиль</MenuItem>
            <MenuItem onClick={() => handleThemeChange('neon')}>Неоновый стиль</MenuItem>
          </Menu>
          <Tooltip title={currentUser && currentUser.name ? currentUser.name : 'Войти'}>
            <IconButton 
              color="default" 
              onClick={onUserSettingsOpen}
              aria-label="Профиль"
              data-testid="profile-button"
            >
              {currentUser && currentUser.name ? (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 18 }} src={currentUser.avatar}>
                  {currentUser.name[0]}
                </Avatar>
              ) : (
                <AccountCircleIcon />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AppBarMain; 