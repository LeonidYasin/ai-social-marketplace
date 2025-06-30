import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import StarIcon from '@mui/icons-material/Star';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const SidebarLeft = () => (
  <Drawer
    variant="permanent"
    anchor="left"
    sx={{ width: 220, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: 220, boxSizing: 'border-box', top: 64 } }}
  >
    <Toolbar />
    <List>
      <ListItem button>
        <ListItemIcon><ListAltIcon /></ListItemIcon>
        <ListItemText primary="Лента" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><StarIcon /></ListItemIcon>
        <ListItemText primary="Избранное" />
      </ListItem>
      <ListItem button>
        <ListItemIcon><SmartToyIcon /></ListItemIcon>
        <ListItemText primary="AI-чаты" />
      </ListItem>
    </List>
  </Drawer>
);

export default SidebarLeft; 