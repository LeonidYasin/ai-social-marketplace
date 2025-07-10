import React from 'react';
import SidebarRight from './SidebarRight';
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
  title: 'Components/SidebarRight',
  component: SidebarRight,
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
  <SidebarRight 
    currentUser={{ id: 1, name: 'Иван Петров' }}
    onClose={() => {}}
  />
); 