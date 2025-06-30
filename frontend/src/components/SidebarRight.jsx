import React from 'react';
import { Drawer, Toolbar, Box, Typography, List, ListItem, ListItemText } from '@mui/material';

const onlineUsers = ['Анна', 'Иван', 'Петр'];
const recommendations = ['Вам может понравиться: iPhone 13', 'Вам может понравиться: MacBook Air'];

const SidebarRight = () => (
  <Drawer
    variant="permanent"
    anchor="right"
    sx={{ width: 260, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: 260, boxSizing: 'border-box', top: 64 } }}
  >
    <Toolbar />
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1">Онлайн-пользователи</Typography>
      <List>
        {onlineUsers.map((user, i) => (
          <ListItem key={i}>
            <ListItemText primary={user} />
          </ListItem>
        ))}
      </List>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>AI-рекомендации</Typography>
      <List>
        {recommendations.map((rec, i) => (
          <ListItem key={i}>
            <ListItemText primary={rec} />
          </ListItem>
        ))}
      </List>
    </Box>
  </Drawer>
);

export default SidebarRight; 