import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, IconButton, List, ListItem, Slide } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

const AIChat = ({ open, onClose }) => {
  const [messages, setMessages] = useState([
    { text: 'Здравствуйте! Чем могу помочь?', isUser: false },
  ]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, isUser: true }, { text: 'AI: (заглушка ответа)', isUser: false }]);
    setInput('');
  };

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Paper sx={{ position: 'absolute', right: 0, top: 0, width: 340, height: 400, zIndex: 10, display: open ? 'flex' : 'none', flexDirection: 'column', boxShadow: 3, borderRadius: 3, bgcolor: '#fff' }}>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>AI-чат</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
          <List>
            {messages.map((msg, i) => (
              <ListItem key={i} sx={{ justifyContent: msg.isUser ? 'flex-end' : 'flex-start' }}>
                <Box sx={{ bgcolor: msg.isUser ? 'primary.main' : 'grey.200', color: msg.isUser ? 'white' : 'black', borderRadius: 2, px: 2, py: 1, maxWidth: '80%' }}>
                  {msg.text}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', borderTop: '1px solid #eee' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Введите сообщение..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );
};

export default AIChat; 