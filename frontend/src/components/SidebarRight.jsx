import React from 'react';
import { 
  Drawer, 
  Toolbar, 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Avatar,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from '@mui/material/IconButton';
import PersonIcon from '@mui/icons-material/Person';

const SidebarRight = ({ users, onUserClick, open = true, onClose, variant = 'permanent', loading = false, onAIChatClick }) => {
  
  return (
    <Drawer
      variant={variant}
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: { xs: '100%', sm: 320 },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 320 },
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderLeft: 1,
          borderColor: 'divider',
        },
      }}
      data-testid="sidebar-right"
    >

      <Toolbar sx={{ 
        minHeight: 64, 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <IconButton 
          onClick={() => {
            console.log('SidebarRight: Кнопка сворачивания нажата');
            onClose();
          }} 
          size="medium" 
          sx={{ 
            color: 'primary.main',
            bgcolor: 'primary.light',
            border: 2,
            borderColor: 'primary.main',
            borderRadius: 2,
            width: 40,
            height: 40,
            '&:hover': {
              color: 'white',
              bgcolor: 'primary.main',
              transform: 'scale(1.1)',
              boxShadow: 3,
            },
            transition: 'all 0.2s ease-in-out',
            boxShadow: 2,
            zIndex: 1000,
          }}
          title="Свернуть панель"
        >
          <ChevronRightIcon fontSize="medium" />
        </IconButton>
      </Toolbar>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={onClose} 
            size="small" 
            sx={{ 
              color: 'text.secondary',
              mr: 1,
              '&:hover': {
                color: 'primary.main',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
            title="Свернуть панель"
          >
            <ChevronRightIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Пользователи ({users?.length || 0})
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List>
            {(users || []).map((user, i) => {
              console.log(`Rendering user ${i}:`, user);
              return (
                <ListItem 
                  key={user.id} 
                  button 
                  onClick={() => onUserClick(user.id)} 
                  sx={{ 
                    borderRadius: 2, 
                    mb: 0.5, 
                    '&:hover': { bgcolor: theme => theme.palette.background.default },
                    position: 'relative'
                  }}
                  data-testid="user-item"
                  data-user-id={user.id}
                >
                  <ListItemIcon>
                    {user.isAI ? (
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <SmartToyIcon fontSize="small" />
                      </Avatar>
                    ) : (
                      <Avatar 
                        sx={{ width: 32, height: 32, bgcolor: user.isRealUser ? 'secondary.main' : 'primary.main' }}
                        src={user.avatar}
                      >
                        {user.name[0]?.toUpperCase() || <PersonIcon />}
                      </Avatar>
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <span data-testid="user-name">
                        {user.name + (user.isMe ? ' (Вы)' : '')}
                      </span>
                    } 
                    secondary={user.isMe ? 'Это вы' : (user.isRealUser ? 'Реальный пользователь' : 'Демо пользователь')}
                  />
                  {user.isAI && (
                    <Chip 
                      label="AI" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                  {user.isMe && (
                    <Chip 
                      label="Вы" 
                      size="small" 
                      color="success" 
                      variant="filled"
                      sx={{ ml: 1 }}
                      data-testid="user-me"
                    />
                  )}
                  {user.isRealUser && (
                    <div data-testid="user-real" style={{ display: 'none' }}></div>
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          AI-рекомендации
        </Typography>
        
        {/* AI рекомендации */}
        <List>
          <ListItem button onClick={onAIChatClick} sx={{ borderRadius: 2, mb: 0.5 }}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
            </ListItemIcon>
            <ListItemText 
              primary="AI Ассистент" 
              secondary="Готов помочь с вопросами"
            />
            <Chip 
              label="AI" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default SidebarRight; 