import React from 'react';
import SidebarLeft from './SidebarLeft';
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
  title: 'Components/SidebarLeft',
  component: SidebarLeft,
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
  <SidebarLeft 
    currentUser={{ id: 1, name: 'Иван Петров' }}
    onClose={() => {}}
  />
); 