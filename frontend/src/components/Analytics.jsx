import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Stack,
  Divider,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Psychology as PsychologyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Моковые данные для аналитики
const generateAnalyticsData = () => {
  const now = new Date();
  const days = [];
  const activity = [];
  const reactions = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    days.push(date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
    activity.push(Math.floor(Math.random() * 50) + 10);
    reactions.push(Math.floor(Math.random() * 100) + 20);
  }

  return { days, activity, reactions };
};

// Топ постов
const generateTopPosts = () => [
  {
    id: 1,
    title: 'Продаю iPhone 13',
    author: 'Анна',
    reactions: 45,
    comments: 12,
    views: 234,
    date: '2 дня назад',
    type: 'sell',
  },
  {
    id: 2,
    title: 'MacBook Air, почти новый',
    author: 'Михаил',
    reactions: 38,
    comments: 8,
    views: 189,
    date: '3 дня назад',
    type: 'sell',
  },
  {
    id: 3,
    title: 'Отдам котенка в хорошие руки',
    author: 'Елена',
    reactions: 67,
    comments: 23,
    views: 456,
    date: '1 день назад',
    type: 'give',
  },
  {
    id: 4,
    title: 'Ищу работу в IT сфере',
    author: 'Дмитрий',
    reactions: 29,
    comments: 15,
    views: 167,
    date: '4 дня назад',
    type: 'tribune',
  },
  {
    id: 5,
    title: 'Куплю игровую приставку',
    author: 'Ольга',
    reactions: 34,
    comments: 9,
    views: 145,
    date: '5 дней назад',
    type: 'buy',
  },
];

// Достижения пользователя
const generateAchievements = () => [
  { id: 1, name: 'Первая публикация', description: 'Опубликовали первый пост', icon: '📝', earned: true, date: '2024-01-15' },
  { id: 2, name: 'Популярный автор', description: 'Получили 50+ реакций на посты', icon: '⭐', earned: true, date: '2024-01-20' },
  { id: 3, name: 'Активный комментатор', description: 'Оставили 20+ комментариев', icon: '💬', earned: true, date: '2024-01-25' },
  { id: 4, name: 'Виртуоз реакций', description: 'Поставили 100+ реакций', icon: '🎯', earned: false, progress: 75 },
  { id: 5, name: 'Социальная бабочка', description: 'Получили реакцию от 10 разных пользователей', icon: '🦋', earned: false, progress: 60 },
  { id: 6, name: 'Топ продавец', description: 'Продали 5+ товаров', icon: '💰', earned: false, progress: 20 },
];

const Analytics = ({ open, onClose, posts, userReactions, comments, isPageMode = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [analyticsData] = useState(generateAnalyticsData());
  const [topPosts] = useState(generateTopPosts());
  const [achievements] = useState(generateAchievements());

  // Статистика пользователя
  const userStats = {
    totalPosts: (posts || []).length,
    totalReactions: Object.values(userReactions || {}).filter(r => r).length,
    totalComments: Object.values(comments || {}).flat().length,
    averageReactions: (posts || []).length > 0 ? 
      (posts || []).reduce((sum, post) => sum + Object.values(post.reactions || {}).reduce((a, b) => a + b, 0), 0) / (posts || []).length : 0,
    mostActiveDay: 'Понедельник',
    favoriteSection: 'Продам',
  };

  // Рекомендации на основе поведения
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (userStats.totalPosts < 5) {
      recommendations.push({
        type: 'post',
        title: 'Попробуйте создать больше постов',
        description: 'Активные авторы получают больше внимания',
        priority: 'high',
      });
    }
    
    if (userStats.averageReactions < 10) {
      recommendations.push({
        type: 'engagement',
        title: 'Улучшите вовлеченность',
        description: 'Добавляйте качественные фото и подробные описания',
        priority: 'medium',
      });
    }
    
    if (userStats.totalComments < 10) {
      recommendations.push({
        type: 'social',
        title: 'Будьте более социальными',
        description: 'Комментируйте посты других пользователей',
        priority: 'medium',
      });
    }
    
    return recommendations;
  };

  const recommendations = generateRecommendations();

  const renderOverviewTab = () => (
    <Grid container spacing={2}>
      {/* Основная статистика */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon color="primary" />
              Общая статистика
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Всего постов</Typography>
                <Chip label={userStats.totalPosts} color="primary" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Ваших реакций</Typography>
                <Chip label={userStats.totalReactions} color="secondary" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Ваших комментариев</Typography>
                <Chip label={userStats.totalComments} color="info" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Средние реакции</Typography>
                <Chip label={userStats.averageReactions.toFixed(1)} color="success" size="small" />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Активность по дням */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon color="primary" />
              Активность (30 дней)
            </Typography>
            <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 1, mt: 2 }}>
              {analyticsData.activity.slice(-7).map((value, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    height: `${(value / 60) * 100}%`,
                    bgcolor: 'primary.main',
                    borderRadius: '4px 4px 0 0',
                    minHeight: 20,
                    position: 'relative',
                  }}
                >
                  <Tooltip title={`${value} действий`}>
                    <Box sx={{ height: '100%' }} />
                  </Tooltip>
                </Box>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Последние 7 дней
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Рекомендации */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PsychologyIcon color="primary" />
              Рекомендации для вас
            </Typography>
            <Grid container spacing={2}>
              {recommendations.map((rec, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined" sx={{ 
                    borderColor: rec.priority === 'high' ? 'error.main' : 
                               rec.priority === 'medium' ? 'warning.main' : 'info.main' 
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {rec.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rec.description}
                      </Typography>
                      <Chip 
                        label={rec.priority === 'high' ? 'Высокий приоритет' : 
                               rec.priority === 'medium' ? 'Средний приоритет' : 'Низкий приоритет'} 
                        size="small" 
                        color={rec.priority === 'high' ? 'error' : 
                               rec.priority === 'medium' ? 'warning' : 'info'}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTopPostsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon color="primary" />
          Топ постов недели
        </Typography>
        <List>
          {topPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: index < 3 ? 'primary.main' : 'grey.400' }}>
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={post.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        Автор: {post.author} • {post.date}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip size="small" label={`👍 ${post.reactions}`} />
                        <Chip size="small" label={`💬 ${post.comments}`} />
                        <Chip size="small" label={`👁 ${post.views}`} />
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip 
                    label={post.type === 'sell' ? 'Продам' : 
                           post.type === 'buy' ? 'Куплю' : 
                           post.type === 'give' ? 'Отдам' : 'Трибуна'} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {index < topPosts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderAchievementsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" />
          Достижения
        </Typography>
        <Grid container spacing={2}>
          {achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card variant="outlined" sx={{ 
                borderColor: achievement.earned ? 'success.main' : 'grey.300',
                bgcolor: achievement.earned ? 'success.50' : 'background.paper',
              }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {achievement.icon}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {achievement.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {achievement.description}
                  </Typography>
                  {achievement.earned ? (
                    <Chip label="Получено" color="success" size="small" />
                  ) : (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Прогресс: {achievement.progress}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={achievement.progress} 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  )}
                  {achievement.date && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Получено: {new Date(achievement.date).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const tabs = [
    { label: 'Обзор', content: renderOverviewTab() },
    { label: 'Топ посты', content: renderTopPostsTab() },
    { label: 'Достижения', content: renderAchievementsTab() },
  ];

  if (isPageMode) {
    return (
      <Box>
        {/* Вкладки */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} sx={{ textTransform: 'none' }} />
            ))}
          </Tabs>
        </Box>

        {/* Содержимое */}
        <Box sx={{ p: 2 }}>
          {tabs[activeTab].content}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1300,
        display: open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        p: isMobile ? 1 : 3,
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 3,
          width: '100%',
          maxWidth: 1200,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider' 
        }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            Аналитика
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Вкладки */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} sx={{ textTransform: 'none' }} />
            ))}
          </Tabs>
        </Box>

        {/* Содержимое */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {tabs[activeTab].content}
        </Box>
      </Box>
    </Box>
  );
};

export default Analytics; 