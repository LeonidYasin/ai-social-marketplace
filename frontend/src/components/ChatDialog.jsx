import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, TextField, IconButton, Avatar, List, ListItem, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const ChatDialog = ({ open, onClose, user, messages, onSend }) => {
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 3, bgcolor: '#fff' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        {user?.isAI ? (
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><SmartToyIcon /></Avatar>
        ) : (
          <Avatar sx={{ width: 40, height: 40 }}>{user?.name?.[0]}</Avatar>
        )}
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>{user?.name}</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, pt: 1 }}>
        <Box ref={listRef} sx={{ maxHeight: 340, overflowY: 'auto', px: 2, pb: 1 }}>
          <List>
            {messages.map((msg, i) => (
              <ListItem key={i} sx={{ justifyContent: msg.isUser ? 'flex-end' : 'flex-start', px: 0 }}>
                <Box sx={{ bgcolor: msg.isUser ? 'primary.main' : 'grey.200', color: msg.isUser ? 'white' : 'black', borderRadius: 2, px: 2, py: 1, maxWidth: '80%' }}>
                  {msg.text}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Введите сообщение..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          sx={{ bgcolor: '#f0f2f5', borderRadius: 2 }}
        />
        <Button color="primary" variant="contained" onClick={handleSend} sx={{ minWidth: 40, ml: 1, borderRadius: 2 }}>
          <SendIcon />
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatDialog; 