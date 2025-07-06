import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  WorkspacePremium as BadgeIcon,
  Psychology as BrainIcon,
  Favorite as HeartIcon,
  Chat as ChatIcon,
  Comment as CommentIcon,
  ThumbUp as LikeIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Celebration as CelebrationIcon,
  LocalFireDepartment as FireIcon,
  Diamond as DiamondIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';

// Система уровней
const LEVELS = [
  { level: 1, name: 'Новичок', xpRequired: 0, color: '#9e9e9e', icon: '🌱' },
  { level: 2, name: 'Активный', xpRequired: 100, color: '#4caf50', icon: '🌿' },
  { level: 3, name: 'Опытный', xpRequired: 300, color: '#2196f3', icon: '🌳' },
  { level: 4, name: 'Эксперт', xpRequired: 600, color: '#ff9800', icon: '🔥' },
  { level: 5, name: 'Мастер', xpRequired: 1000, color: '#f44336', icon: '👑' },
  { level: 6, name: 'Легенда', xpRequired: 2000, color: '#9c27b0', icon: '⭐' },
  { level: 7, name: 'Миф', xpRequired: 5000, color: '#ffd700', icon: '💎' },
];

// Достижения
const ACHIEVEMENTS = [
  {
    id: 'first_post',
    name: 'Первая публикация',
    description: 'Опубликовали первый пост',
    icon: '📝',
    xpReward: 50,
    category: 'posts',
    earned: true,
    date: '2024-01-15',
  },
  {
    id: 'popular_author',
    name: 'Популярный автор',
    description: 'Получили 50+ реакций на посты',
    icon: '⭐',
    xpReward: 100,
    category: 'engagement',
    earned: true,
    date: '2024-01-20',
  },
  {
    id: 'social_butterfly',
    name: 'Социальная бабочка',
    description: 'Получили реакцию от 10 разных пользователей',
    icon: '🦋',
    xpReward: 150,
    category: 'social',
    earned: true,
    date: '2024-01-25',
  },
  {
    id: 'reaction_master',
    name: 'Мастер реакций',
    description: 'Поставили 100+ реакций',
    icon: '🎯',
    xpReward: 75,
    category: 'reactions',
    earned: false,
    progress: 75,
  },
  {
    id: 'comment_king',
    name: 'Король комментариев',
    description: 'Оставили 50+ комментариев',
    icon: '💬',
    xpReward: 80,
    category: 'comments',
    earned: false,
    progress: 60,
  },
  {
    id: 'top_seller',
    name: 'Топ продавец',
    description: 'Продали 5+ товаров',
    icon: '💰',
    xpReward: 200,
    category: 'business',
    earned: false,
    progress: 20,
  },
  {
    id: 'trending_star',
    name: 'Тренд-звезда',
    description: 'Ваш пост стал популярным',
    icon: '🔥',
    xpReward: 300,
    category: 'viral',
    earned: false,
    progress: 0,
  },
  {
    id: 'helpful_hand',
    name: 'Помощная рука',
    description: 'Помогли 10+ пользователям',
    icon: '🤝',
    xpReward: 120,
    category: 'help',
    earned: false,
    progress: 40,
  },
];

// Бейджи
const BADGES = [
  { id: 'verified', name: 'Проверенный', icon: '✓', color: '#4caf50', earned: true },
  { id: 'premium', name: 'Премиум', icon: '💎', color: '#ffd700', earned: false },
  { id: 'moderator', name: 'Модератор', icon: '🛡️', color: '#2196f3', earned: false },
  { id: 'influencer', name: 'Инфлюенсер', icon: '🌟', color: '#f44336', earned: false },
  { id: 'early_bird', name: 'Ранняя пташка', icon: '🐦', color: '#9c27b0', earned: true },
  { id: 'creative', name: 'Креативщик', icon: '🎨', color: '#ff9800', earned: false },
];

// Рейтинги
const RATINGS = [
  { id: 1, name: 'Анна Петрова', avatar: 'АП', level: 5, xp: 1250, posts: 15, reactions: 234 },
  { id: 2, name: 'Михаил Сидоров', avatar: 'МС', level: 4, xp: 890, posts: 8, reactions: 156 },
  { id: 3, name: 'Елена Козлова', avatar: 'ЕК', level: 6, xp: 2100, posts: 23, reactions: 567 },
  { id: 4, name: 'Дмитрий Волков', avatar: 'ДВ', level: 3, xp: 450, posts: 5, reactions: 89 },
  { id: 5, name: 'Ольга Морозова', avatar: 'ОМ', level: 4, xp: 720, posts: 12, reactions: 198 },
];

const Gamification = ({ open, onClose, userStats }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Расчет уровня и XP пользователя
  const calculateUserLevel = () => {
    const totalXP = userStats?.totalXP || 0;
    const currentLevel = LEVELS.find(level => totalXP >= level.xpRequired) || LEVELS[0];
    const nextLevel = LEVELS.find(level => level.xpRequired > totalXP) || currentLevel;
    
    const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
    const xpRequiredForNext = nextLevel.xpRequired - currentLevel.xpRequired;
    const progress = xpRequiredForNext > 0 ? (xpInCurrentLevel / xpRequiredForNext) * 100 : 100;

    return {
      current: currentLevel,
      next: nextLevel,
      progress,
      totalXP,
      xpInCurrentLevel,
      xpRequiredForNext,
    };
  };

  const userLevel = calculateUserLevel();

  // Получение достижений пользователя
  const getUserAchievements = () => {
    return ACHIEVEMENTS.map(achievement => {
      // Имитация прогресса на основе статистики пользователя
      let progress = 0;
      if (!achievement.earned) {
        switch (achievement.id) {
          case 'reaction_master':
            progress = Math.min((userStats?.totalReactions || 0) / 100 * 100, 100);
            break;
          case 'comment_king':
            progress = Math.min((userStats?.totalComments || 0) / 50 * 100, 100);
            break;
          case 'top_seller':
            progress = Math.min((userStats?.soldItems || 0) / 5 * 100, 100);
            break;
          default:
            progress = achievement.progress || 0;
        }
      }
      return { ...achievement, progress };
    });
  };

  const userAchievements = getUserAchievements();
  const earnedAchievements = userAchievements.filter(a => a.earned);
  const totalEarnedXP = earnedAchievements.reduce((sum, a) => sum + a.xpReward, 0);

  const tabs = [
    { label: 'Профиль', value: 'profile' },
    { label: 'Достижения', value: 'achievements' },
    { label: 'Рейтинг', value: 'rating' },
    { label: 'Бейджи', value: 'badges' },
  ];

  const renderProfileTab = () => (
    <Grid container spacing={3}>
      {/* Уровень и прогресс */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: userLevel.current.color,
                  fontSize: 32,
                }}
              >
                {userLevel.current.icon}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Уровень {userLevel.current.level}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                  {userLevel.current.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userLevel.totalXP} XP
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  До следующего уровня
                </Typography>
                <Typography variant="body2" color="primary">
                  {userLevel.xpInCurrentLevel}/{userLevel.xpRequiredForNext} XP
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={userLevel.progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: userLevel.current.color,
                  },
                }}
              />
            </Box>

            {userLevel.next && userLevel.current.level !== userLevel.next.level && (
              <Typography variant="body2" color="text.secondary">
                Следующий уровень: {userLevel.next.name} ({userLevel.next.xpRequired} XP)
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Статистика */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon />
              Статистика
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ChatIcon color="primary" />
                  <Typography>Посты</Typography>
                </Box>
                <Chip label={userStats?.totalPosts || 0} color="primary" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LikeIcon color="success" />
                  <Typography>Реакции</Typography>
                </Box>
                <Chip label={userStats?.totalReactions || 0} color="success" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CommentIcon color="info" />
                  <Typography>Комментарии</Typography>
                </Box>
                <Chip label={userStats?.totalComments || 0} color="info" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewIcon color="warning" />
                  <Typography>Просмотры</Typography>
                </Box>
                <Chip label={userStats?.totalViews || 0} color="warning" />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Достижения */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon />
              Достижения ({(earnedAchievements || []).length}/{ACHIEVEMENTS.length})
            </Typography>
            <Grid container spacing={2}>
              {userAchievements.slice(0, 6).map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: achievement.earned ? 'success.main' : 'grey.300',
                      bgcolor: achievement.earned ? 'success.50' : 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                    onClick={() => setSelectedAchievement(achievement)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {achievement.icon}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        {achievement.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        {achievement.description}
                      </Typography>
                      {achievement.earned ? (
                        <Chip label="Получено" color="success" size="small" />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {achievement.progress.toFixed(0)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={achievement.progress}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {(userAchievements || []).length > 6 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button variant="outlined" onClick={() => setActiveTab(1)}>
                  Показать все достижения
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAchievementsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon />
          Все достижения
        </Typography>
        <Grid container spacing={2}>
          {userAchievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={4} key={achievement.id}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: achievement.earned ? 'success.main' : 'grey.300',
                  bgcolor: achievement.earned ? 'success.50' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => setSelectedAchievement(achievement)}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {achievement.icon}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    {achievement.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    {achievement.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                    <StarIcon fontSize="small" color="warning" />
                    <Typography variant="caption" color="warning.main">
                      {achievement.xpReward} XP
                    </Typography>
                  </Box>
                  {achievement.earned ? (
                    <Chip label="Получено" color="success" size="small" />
                  ) : (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.progress.toFixed(0)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={achievement.progress}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderRatingTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon />
          Топ пользователей
        </Typography>
        <List>
          {RATINGS.map((user, index) => (
            <React.Fragment key={user.id}>
              <ListItem>
                <ListItemAvatar>
                  <Badge
                    badgeContent={index + 1}
                    color={index < 3 ? 'primary' : 'default'}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: index === 0 ? '#ffd700' : 
                                index === 1 ? '#c0c0c0' : 
                                index === 2 ? '#cd7f32' : 'grey.500',
                      },
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {user.avatar}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        Уровень {user.level} • {user.xp} XP
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip size="small" label={`${user.posts} постов`} />
                        <Chip size="small" label={`${user.reactions} реакций`} />
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={`#${index + 1}`}
                    color={index < 3 ? 'primary' : 'default'}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {index < RATINGS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderBadgesTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BadgeIcon />
          Бейджи
        </Typography>
        <Grid container spacing={2}>
          {BADGES.map((badge) => (
            <Grid item xs={12} sm={6} md={4} key={badge.id}>
              <Card
                variant="outlined"
                sx={{
                  borderColor: badge.earned ? badge.color : 'grey.300',
                  bgcolor: badge.earned ? `${badge.color}10` : 'background.paper',
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Typography variant="h3" sx={{ mb: 1, opacity: badge.earned ? 1 : 0.3 }}>
                  {badge.icon}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {badge.name}
                </Typography>
                <Chip
                  label={badge.earned ? 'Получен' : 'Не получен'}
                  color={badge.earned ? 'success' : 'default'}
                  size="small"
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderProfileTab();
      case 1:
        return renderAchievementsTab();
      case 2:
        return renderRatingTab();
      case 3:
        return renderBadgesTab();
      default:
        return renderProfileTab();
    }
  };

  if (typeof open === 'undefined') {
    // Использование как вкладка: просто рендерим содержимое без Dialog
    return (
      <Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={0}>
            {tabs.map((tab, index) => (
              <Button
                key={tab.value}
                onClick={() => setActiveTab(index)}
                sx={{
                  flex: 1,
                  py: 2,
                  borderRadius: 0,
                  borderBottom: activeTab === index ? 2 : 0,
                  borderColor: 'primary.main',
                  color: activeTab === index ? 'primary.main' : 'text.secondary',
                  fontWeight: activeTab === index ? 600 : 400,
                  textTransform: 'none',
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Stack>
        </Box>
        <Box sx={{ p: 3 }}>
          {renderTabContent()}
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon color="primary" />
            <Typography variant="h6">
              Гамификация
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={0}>
              {tabs.map((tab, index) => (
                <Button
                  key={tab.value}
                  onClick={() => setActiveTab(index)}
                  sx={{
                    flex: 1,
                    py: 2,
                    borderRadius: 0,
                    borderBottom: activeTab === index ? 2 : 0,
                    borderColor: 'primary.main',
                    color: activeTab === index ? 'primary.main' : 'text.secondary',
                    fontWeight: activeTab === index ? 600 : 400,
                    textTransform: 'none',
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box sx={{ p: 3 }}>
            {renderTabContent()}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Детали достижения */}
      <Dialog
        open={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4">
                  {selectedAchievement.icon}
                </Typography>
                <Box>
                  <Typography variant="h6">
                    {selectedAchievement.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAchievement.description}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  Награда: {selectedAchievement.xpReward} XP
                </Typography>
                {selectedAchievement.earned ? (
                  <Box>
                    <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                      Получено {selectedAchievement.date}
                    </Typography>
                    <Chip label="Достижение выполнено!" color="success" />
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Прогресс: {selectedAchievement.progress.toFixed(0)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={selectedAchievement.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAchievement(null)}>
                Закрыть
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default Gamification; 