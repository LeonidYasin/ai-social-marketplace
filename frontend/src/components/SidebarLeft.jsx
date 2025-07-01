import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box, Typography, InputBase, Avatar, Divider } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import StarIcon from '@mui/icons-material/Star';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';

const SidebarLeft = ({ chatList, onChatClick, searchChat, setSearchChat, open = true, onClose, variant = 'permanent', theme }) => (
  <Drawer
    variant={variant}
    anchor="left"
    open={open}
    onClose={onClose}
    sx={{ width: 220, flexShrink: 0, [`& .MuiDrawer-paper`]: {
      width: 220,
      boxSizing: 'border-box',
      top: 64,
      bgcolor: theme => theme.palette.background.paper,
      borderRadius: '0 16px 16px 0',
      boxShadow: 3,
      border: 'none',
      p: 0,
    } }}
  >
    <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'flex-end', p: 0 }}>
      <IconButton onClick={onClose} size="small" sx={{ ml: 'auto', display: { xs: 'inline-flex', md: 'none' } }}>
        <ChevronLeftIcon />
      </IconButton>
    </Toolbar>
    <Box sx={{ mt: 2, px: 2 }}>
      {/* Основные разделы */}
      <List sx={{ mb: 1 }}>
        <ListItem button sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: theme => theme.palette.background.default } }}>
          <ListItemIcon><ListAltIcon /></ListItemIcon>
          <ListItemText primary="Лента" />
        </ListItem>
        <ListItem button sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: theme => theme.palette.background.default } }}>
          <ListItemIcon><StarIcon /></ListItemIcon>
          <ListItemText primary="Избранное" />
        </ListItem>
        <ListItem button sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: theme => theme.palette.background.default } }}>
          <ListItemIcon><SmartToyIcon /></ListItemIcon>
          <ListItemText primary="AI-чаты" />
        </ListItem>
      </List>
      <Divider sx={{ mb: 1 }} />
      {/* Чаты */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Чаты</Typography>
      <InputBase
        placeholder="Поиск чата..."
        value={searchChat}
        onChange={e => setSearchChat(e.target.value)}
        sx={{ bgcolor: theme => theme.palette.background.default, borderRadius: 2, px: 2, py: 0.5, mb: 1, width: '100%' }}
      />
      <List>
        {chatList.map(chat => (
          <ListItem button key={chat.userId} onClick={() => onChatClick(chat.userId)} sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: theme => theme.palette.background.default } }}>
            <ListItemIcon>
              {chat.isAI ? (
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <SmartToyIcon fontSize="small" />
                </Avatar>
              ) : (
                <Avatar sx={{ width: 32, height: 32 }}>{chat.name[0]}</Avatar>
              )}
            </ListItemIcon>
            <ListItemText
              primary={chat.name}
              secondary={chat.lastMsg}
              primaryTypographyProps={{ fontWeight: 500 }}
              secondaryTypographyProps={{ noWrap: true, fontSize: 13 }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  </Drawer>
);

export default SidebarLeft; 