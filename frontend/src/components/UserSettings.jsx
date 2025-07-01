import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Avatar,
  Divider,
  Stack,
  Chip,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ColorLens as ColorLensIcon,
} from '@mui/icons-material';

// Темы оформления
const THEMES = {
  light: { name: 'Светлая', icon: <LightModeIcon />, primary: '#1976d2' },
  dark: { name: 'Темная', icon: <DarkModeIcon />, primary: '#90caf9' },
  blue: { name: 'Синяя', icon: <ColorLensIcon />, primary: '#2196f3' },
  green: { name: 'Зеленая', icon: <ColorLensIcon />, primary: '#4caf50' },
  purple: { name: 'Фиолетовая', icon: <ColorLensIcon />, primary: '#9c27b0' },
};

// Разделы для фильтрации
const SECTIONS = [
  { value: 'all', label: 'Все разделы' },
  { value: 'tribune', label: 'Трибуна' },
  { value: 'video', label: 'Видео' },
  { value: 'sell', label: 'Продам' },
  { value: 'buy', label: 'Куплю' },
  { value: 'give', label: 'Отдам' },
  { value: 'realty', label: 'Недвижимость' },
];

// Настройки уведомлений
const NOTIFICATION_TYPES = [
  { key: 'newPosts', label: 'Новые посты', description: 'Уведомления о новых публикациях' },
  { key: 'reactions', label: 'Реакции', description: 'Когда кто-то реагирует на ваши посты' },
  { key: 'comments', label: 'Комментарии', description: 'Новые комментарии к вашим постам' },
  { key: 'mentions', label: 'Упоминания', description: 'Когда вас упоминают в комментариях' },
  { key: 'aiChat', label: 'AI чат', description: 'Уведомления от AI ассистента' },
];

const UserSettings = ({ open, onClose, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState({
    name: 'Александр',
    email: 'alex@example.com',
    bio: 'Люблю технологии и новые знакомства',
    avatar: null,
  });
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#1976d2');
  const [notifications, setNotifications] = useState({
    newPosts: true,
    reactions: true,
    comments: true,
    mentions: false,
    aiChat: true,
  });
  const [filters, setFilters] = useState({
    sections: ['all'],
    sortBy: 'newest',
    showReactions: true,
    showComments: true,
    minReactions: 0,
  });

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setProfile(settings.profile || profile);
      setTheme(settings.theme || 'light');
      setPrimaryColor(settings.primaryColor || '#1976d2');
      setNotifications(settings.notifications || notifications);
      setFilters(settings.filters || filters);
    }
  }, []);

  // Сохранение настроек в localStorage
  useEffect(() => {
    const settings = {
      profile,
      theme,
      primaryColor,
      notifications,
      filters,
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Уведомляем родительский компонент об изменениях
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [profile, theme, primaryColor, notifications, filters]);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setPrimaryColor(THEMES[newTheme].primary);
  };

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSectionFilterChange = (section) => {
    setFilters(prev => {
      const currentSections = prev.sections;
      if (section === 'all') {
        return { ...prev, sections: ['all'] };
      }
      
      const newSections = currentSections.includes('all') 
        ? [section]
        : currentSections.includes(section)
          ? currentSections.filter(s => s !== section)
          : [...currentSections, section];
      
      return { ...prev, sections: newSections.length === 0 ? ['all'] : newSections };
    });
  };

  const renderProfileTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Профиль пользователя</Typography>
      
      <Stack spacing={3}>
        {/* Аватар */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile.avatar}
              sx={{ width: 80, height: 80, fontSize: 32 }}
            >
              {profile.name[0]}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <PhotoCameraIcon />
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </IconButton>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {profile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.email}
            </Typography>
          </Box>
        </Box>

        {/* Имя */}
        <TextField
          label="Имя"
          value={profile.name}
          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
          fullWidth
        />

        {/* Email */}
        <TextField
          label="Email"
          type="email"
          value={profile.email}
          onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
          fullWidth
        />

        {/* Биография */}
        <TextField
          label="О себе"
          multiline
          rows={3}
          value={profile.bio}
          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          fullWidth
        />
      </Stack>
    </Box>
  );

  const renderThemeTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Внешний вид</Typography>
      
      <Stack spacing={3}>
        {/* Выбор темы */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Тема оформления</Typography>
          <Grid container spacing={2}>
            {Object.entries(THEMES).map(([key, themeData]) => (
              <Grid item xs={6} sm={4} key={key}>
                <Card
                  onClick={() => handleThemeChange(key)}
                  sx={{
                    cursor: 'pointer',
                    border: theme === key ? '2px solid' : '1px solid',
                    borderColor: theme === key ? 'primary.main' : 'divider',
                    bgcolor: theme === key ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Box sx={{ mb: 1, color: themeData.primary }}>
                      {themeData.icon}
                    </Box>
                    <Typography variant="body2">{themeData.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Основной цвет */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Основной цвет</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: primaryColor,
                border: '2px solid',
                borderColor: 'divider',
                cursor: 'pointer',
              }}
            />
            <Typography variant="body2">{primaryColor}</Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );

  const renderNotificationsTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Уведомления</Typography>
      
      <Stack spacing={2}>
        {NOTIFICATION_TYPES.map((type) => (
          <Box key={type.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2">{type.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {type.description}
              </Typography>
            </Box>
            <Switch
              checked={notifications[type.key]}
              onChange={() => handleNotificationChange(type.key)}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );

  const renderFiltersTab = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Фильтры контента</Typography>
      
      <Stack spacing={3}>
        {/* Разделы */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Разделы</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {SECTIONS.map((section) => (
              <Chip
                key={section.value}
                label={section.label}
                onClick={() => handleSectionFilterChange(section.value)}
                color={filters.sections.includes(section.value) ? 'primary' : 'default'}
                variant={filters.sections.includes(section.value) ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Сортировка */}
        <FormControl fullWidth>
          <InputLabel>Сортировка</InputLabel>
          <Select
            value={filters.sortBy}
            label="Сортировка"
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <MenuItem value="newest">Сначала новые</MenuItem>
            <MenuItem value="oldest">Сначала старые</MenuItem>
            <MenuItem value="popular">По популярности</MenuItem>
            <MenuItem value="reactions">По реакциям</MenuItem>
          </Select>
        </FormControl>

        {/* Минимальное количество реакций */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Минимальное количество реакций: {filters.minReactions}
          </Typography>
          <Slider
            value={filters.minReactions}
            onChange={(e, value) => handleFilterChange('minReactions', value)}
            min={0}
            max={50}
            marks={[
              { value: 0, label: '0' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
          />
        </Box>

        {/* Дополнительные настройки */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Отображение</Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showReactions}
                  onChange={(e) => handleFilterChange('showReactions', e.target.checked)}
                />
              }
              label="Показывать реакции"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showComments}
                  onChange={(e) => handleFilterChange('showComments', e.target.checked)}
                />
              }
              label="Показывать комментарии"
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );

  const tabs = [
    { label: 'Профиль', icon: <PersonIcon />, content: renderProfileTab() },
    { label: 'Внешний вид', icon: <PaletteIcon />, content: renderThemeTab() },
    { label: 'Уведомления', icon: <NotificationsIcon />, content: renderNotificationsTab() },
    { label: 'Фильтры', icon: <FilterIcon />, content: renderFiltersTab() },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6">Настройки</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{ textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {tabs[activeTab].content}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={onClose}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSettings; 