import React from 'react';
import Chat from './Chat';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Создаем тему для MUI
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

export default {
  title: 'Components/Chat',
  component: Chat,
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
  <Chat 
    currentUser={{ id: 1, name: 'Иван Петров' }}
    socket={null}
    onClose={() => {}}
  />
); 