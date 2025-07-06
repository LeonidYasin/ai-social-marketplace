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

const SidebarRight = ({ users, onUserClick, open = true, onClose, variant = 'permanent', loading = false }) => {
  console.log('SidebarRight received users:', users);
  
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
      <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'flex-start', p: 0 }}>
        <IconButton onClick={onClose} size="small" sx={{ mr: 'auto', display: { xs: 'inline-flex', md: 'none' } }}>
          <ChevronRightIcon />
        </IconButton>
      </Toolbar>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Пользователи ({users?.length || 0})
        </Typography>
        
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
          <ListItem sx={{ borderRadius: 2, mb: 0.5 }}>
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