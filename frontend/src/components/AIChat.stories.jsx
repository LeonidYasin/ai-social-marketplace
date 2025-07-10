import React from 'react';
import AIChat from './AIChat';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Создаем тему для MUI
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6c5ce7',
    },
  },
});

export default {
  title: 'Components/AIChat',
  component: AIChat,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export const Default = () => (
  <AIChat 
    currentUser={{ id: 1, name: 'Иван Петров' }}
    socket={null}
    onClose={() => {}}
  />
); 