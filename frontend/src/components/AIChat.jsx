import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, IconButton, List, ListItem } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const AIChat = () => {
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
    <Paper sx={{ position: 'fixed', left: 240, bottom: 24, width: 340, height: 400, zIndex: 1200, display: { xs: 'none', md: 'block' } }} elevation={6}>
      <Box sx={{ p: 2, height: '85%', overflowY: 'auto' }}>
        <Typography variant="subtitle1">AI-чат</Typography>
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
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderTop: '1px solid #eee' }}>
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
  );
};

export default AIChat; 