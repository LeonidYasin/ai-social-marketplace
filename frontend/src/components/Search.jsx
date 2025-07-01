import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Typography,
  Divider,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Autocomplete,
  Popper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Person as PersonIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  AttachMoney as PriceIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';

// Моковые данные для поиска
const mockPosts = [
  { id: 1, title: 'Продаю iPhone 13', author: 'Анна', section: 'sell', price: '45000', location: 'Москва', date: '2024-01-15', tags: ['техника', 'смартфон'] },
  { id: 2, title: 'MacBook Air, почти новый', author: 'Михаил', section: 'sell', price: '120000', location: 'СПб', date: '2024-01-14', tags: ['техника', 'ноутбук'] },
  { id: 3, title: 'Отдам котенка в хорошие руки', author: 'Елена', section: 'give', price: '0', location: 'Москва', date: '2024-01-13', tags: ['животные', 'котенок'] },
  { id: 4, title: 'Ищу работу в IT сфере', author: 'Дмитрий', section: 'tribune', price: '', location: 'Москва', date: '2024-01-12', tags: ['работа', 'IT'] },
  { id: 5, title: 'Куплю игровую приставку', author: 'Ольга', section: 'buy', price: '30000', location: 'Казань', date: '2024-01-11', tags: ['техника', 'игры'] },
];

const mockUsers = [
  { id: 1, name: 'Анна Петрова', avatar: 'АП', rating: 4.8, posts: 15, location: 'Москва' },
  { id: 2, name: 'Михаил Сидоров', avatar: 'МС', rating: 4.5, posts: 8, location: 'СПб' },
  { id: 3, name: 'Елена Козлова', avatar: 'ЕК', rating: 4.9, posts: 23, location: 'Москва' },
  { id: 4, name: 'Дмитрий Волков', avatar: 'ДВ', rating: 4.2, posts: 5, location: 'Москва' },
  { id: 5, name: 'Ольга Морозова', avatar: 'ОМ', rating: 4.7, posts: 12, location: 'Казань' },
];

const sections = [
  { value: 'all', label: 'Все разделы' },
  { value: 'tribune', label: 'Трибуна' },
  { value: 'sell', label: 'Продам' },
  { value: 'buy', label: 'Куплю' },
  { value: 'give', label: 'Отдам' },
  { value: 'realty', label: 'Недвижимость' },
];

const locations = [
  'Все города',
  'Москва',
  'СПб',
  'Казань',
  'Новосибирск',
  'Екатеринбург',
];

// Данные для автодополнения
const autocompleteData = [
  'iPhone 13', 'MacBook Air', 'котенок', 'работа IT', 'игровая приставка',
  'квартира', 'автомобиль', 'велосипед', 'книги', 'одежда',
  'техника', 'мебель', 'спорт', 'хобби', 'образование',
  'Москва', 'СПб', 'Казань', 'Новосибирск', 'Екатеринбург',
  'Анна', 'Михаил', 'Елена', 'Дмитрий', 'Ольга',
];

const SearchDialog = ({ open, onClose, onSearchResult }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchInputRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([
    'iPhone 13', 'MacBook', 'котенок', 'работа IT', 'игровая приставка'
  ]);
  const [filters, setFilters] = useState({
    section: 'all',
    location: 'Все города',
    priceMin: '',
    priceMax: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState({ posts: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Загрузка истории поиска из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Сохранение истории поиска
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Фокус на поле поиска при открытии
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [open]);

  // Добавление в историю поиска
  const addToHistory = (searchQuery) => {
    if (searchQuery.trim()) {
      const newHistory = [searchQuery, ...searchHistory.filter(item => item !== searchQuery)].slice(0, 10);
      setSearchHistory(newHistory);
    }
  };

  // Выполнение поиска
  const performSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    addToHistory(searchQuery);

    // Имитация задержки поиска
    await new Promise(resolve => setTimeout(resolve, 500));

    const results = {
      posts: mockPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
      users: mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    };

    setSearchResults(results);
    setIsSearching(false);

    // Передача результатов наверх
    if (onSearchResult) {
      onSearchResult(results);
    }
  };

  // Обработка поиска
  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  // Очистка поиска
  const handleClear = () => {
    setQuery('');
    setSearchResults({ posts: [], users: [] });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Удаление из истории
  const removeFromHistory = (item) => {
    setSearchHistory(prev => prev.filter(historyItem => historyItem !== item));
  };

  // Очистка всей истории
  const clearHistory = () => {
    setSearchHistory([]);
  };

  const tabs = [
    { label: 'Все', value: 'all' },
    { label: 'Посты', value: 'posts' },
    { label: 'Пользователи', value: 'users' },
  ];

  const renderSearchHistory = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          История поиска
        </Typography>
        {searchHistory.length > 0 && (
          <Button size="small" onClick={clearHistory} color="error">
            Очистить
          </Button>
        )}
      </Box>
      {searchHistory.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          История поиска пуста
        </Typography>
      ) : (
        <List>
          {searchHistory.map((item, index) => (
            <ListItem
              key={index}
              button
              onClick={() => {
                setQuery(item);
                performSearch(item);
              }}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
                  <SearchIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={item} />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromHistory(item);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  const renderTrendingSearches = () => (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TrendingIcon />
        Популярные запросы
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {trendingSearches.map((search, index) => (
          <Chip
            key={index}
            label={search}
            clickable
            onClick={() => {
              setQuery(search);
              performSearch(search);
            }}
            variant="outlined"
            size="small"
          />
        ))}
      </Stack>
    </Box>
  );

  const renderFilters = () => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterIcon />
          Фильтры
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Раздел</InputLabel>
              <Select
                value={filters.section}
                onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                label="Раздел"
              >
                {sections.map(section => (
                  <MenuItem key={section.value} value={section.value}>
                    {section.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Город</InputLabel>
              <Select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                label="Город"
              >
                {locations.map(location => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Цена от"
              type="number"
              value={filters.priceMin}
              onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">₽</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Цена до"
              type="number"
              value={filters.priceMax}
              onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">₽</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Поиск...</Typography>
        </Box>
      );
    }

    if (!query.trim()) {
      return (
        <Box>
          {renderSearchHistory()}
          <Divider sx={{ my: 3 }} />
          {renderTrendingSearches()}
        </Box>
      );
    }

    const { posts, users } = searchResults;
    const hasResults = posts.length > 0 || users.length > 0;

    if (!hasResults) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Ничего не найдено
          </Typography>
          <Typography color="text.secondary">
            Попробуйте изменить запрос или фильтры
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          {tabs.map(tab => (
            <Tab key={tab.value} label={tab.label} />
          ))}
        </Tabs>

        {(activeTab === 0 || activeTab === 1) && posts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ArticleIcon />
              Посты ({posts.length})
            </Typography>
            <List>
              {posts.map(post => (
                <ListItem key={post.id} button sx={{ borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <CategoryIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={post.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          Автор: {post.author} • {post.location}
                        </Typography>
                        {post.price && (
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            • {post.price} ₽
                          </Typography>
                        )}
                        <Box sx={{ mt: 0.5 }}>
                          {post.tags.map(tag => (
                            <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <Chip label={sections.find(s => s.value === post.section)?.label} size="small" />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {(activeTab === 0 || activeTab === 2) && users.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon />
              Пользователи ({users.length})
            </Typography>
            <List>
              {users.map(user => (
                <ListItem key={user.id} button sx={{ borderRadius: 1, mb: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {user.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          {user.location} • {user.posts} постов
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                            Рейтинг: {user.rating} ⭐
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      TransitionComponent={Slide}
      transitionDirection="up"
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Typography variant="h6">Поиск</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2 }}>
        {/* Поле поиска с автодополнением */}
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
          <Autocomplete
            freeSolo
            options={autocompleteData}
            value={query}
            onChange={(event, newValue) => {
              if (typeof newValue === 'string') {
                setQuery(newValue);
                performSearch(newValue);
              }
            }}
            onInputChange={(event, newInputValue) => {
              setQuery(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                ref={searchInputRef}
                fullWidth
                placeholder="Поиск постов, пользователей, тегам..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: query && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClear} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            )}
            PopperComponent={(props) => (
              <Popper
                {...props}
                placement="bottom-start"
                modifiers={[
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 8],
                    },
                  },
                ]}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                {option}
              </Box>
            )}
          />
          <Stack direction="row" spacing={1}>
            <Button
              type="submit"
              variant="contained"
              disabled={!query.trim() || isSearching}
              sx={{ flex: 1 }}
            >
              {isSearching ? 'Поиск...' : 'Найти'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterIcon />}
            >
              Фильтры
            </Button>
          </Stack>
        </Box>

        {/* Фильтры */}
        <Fade in={showFilters}>
          <Box>
            {showFilters && renderFilters()}
          </Box>
        </Fade>

        {/* Результаты поиска */}
        {renderSearchResults()}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog; 