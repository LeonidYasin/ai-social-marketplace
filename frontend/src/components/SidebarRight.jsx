import React from 'react';
import { Drawer, Toolbar, Box, Typography, List, ListItem, ListItemText, ListItemIcon, Avatar } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from '@mui/material/IconButton';

const SidebarRight = ({ users, onUserClick, open = true, onClose, variant = 'permanent' }) => (
  <Drawer
    variant={variant}
    anchor="right"
    open={open}
    onClose={onClose}
    sx={{ width: 260, flexShrink: 0, [`& .MuiDrawer-paper`]: {
      width: 260,
      boxSizing: 'border-box',
      top: 64,
      bgcolor: theme => theme.palette.background.paper,
      borderRadius: '16px 0 0 16px',
      boxShadow: 3,
      border: 'none',
      p: 0,
    } }}
  >
    <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'flex-start', p: 0 }}>
      <IconButton onClick={onClose} size="small" sx={{ mr: 'auto', display: { xs: 'inline-flex', md: 'none' } }}>
        <ChevronRightIcon />
      </IconButton>
    </Toolbar>
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1">Онлайн-пользователи</Typography>
      <List>
        {users.map((user, i) => (
          <ListItem key={user.id} button onClick={() => onUserClick(user.id)} sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: theme => theme.palette.background.default } }}>
            <ListItemIcon>
              {user.isAI ? (
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <SmartToyIcon fontSize="small" />
                </Avatar>
              ) : (
                <Avatar sx={{ width: 32, height: 32 }}>{user.name[0]}</Avatar>
              )}
            </ListItemIcon>
            <ListItemText primary={user.name} />
          </ListItem>
        ))}
      </List>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>AI-рекомендации</Typography>
      <List>
        <ListItem sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: theme => theme.palette.background.default } }}>
          <ListItemText primary="Вам может понравиться: iPhone 13" />
        </ListItem>
        <ListItem sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: theme => theme.palette.background.default } }}>
          <ListItemText primary="Вам может понравиться: MacBook Air" />
        </ListItem>
      </List>
    </Box>
  </Drawer>
);

export default SidebarRight; 