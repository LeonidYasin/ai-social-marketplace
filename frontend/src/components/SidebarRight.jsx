import React from 'react';
import { Drawer, Toolbar, Box, Typography, List, ListItem, ListItemText, ListItemIcon, Avatar } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const SidebarRight = ({ users, onUserClick }) => (
  <Drawer
    variant="permanent"
    anchor="right"
    sx={{ width: 260, flexShrink: 0, [`& .MuiDrawer-paper`]: {
      width: 260,
      boxSizing: 'border-box',
      top: 64,
      bgcolor: '#fff',
      borderRadius: '16px 0 0 16px',
      boxShadow: 3,
      border: 'none',
      p: 0,
    } }}
  >
    <Toolbar />
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1">Онлайн-пользователи</Typography>
      <List>
        {users.map((user, i) => (
          <ListItem key={user.id} button onClick={() => onUserClick(user.id)} sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#f0f2f5' } }}>
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
        <ListItem sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#f0f2f5' } }}>
          <ListItemText primary="Вам может понравиться: iPhone 13" />
        </ListItem>
        <ListItem sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#f0f2f5' } }}>
          <ListItemText primary="Вам может понравиться: MacBook Air" />
        </ListItem>
      </List>
    </Box>
  </Drawer>
);

export default SidebarRight; 