import React from 'react';
import AppBar from './AppBar';
import { BrowserRouter } from 'react-router-dom';
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
  title: 'Components/AppBar',
  component: AppBar,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => (
  <AppBar 
    onAnalyticsOpen={() => {}}
    onSearchOpen={() => {}}
    onNotificationsOpen={() => {}}
    onGamificationOpen={() => {}}
    onUserSettingsOpen={() => {}}
    onAdminPanelOpen={() => {}}
    currentUser={null}
    themeName="facebook"
    setThemeName={() => {}}
    onDebugUsers={() => {}}
    socket={null}
    setLeftSidebarOpen={() => {}}
    setRightSidebarOpen={() => {}}
    onShowPresentation={() => {}}
  />
);

export const WithUser = () => (
  <AppBar 
    onAnalyticsOpen={() => {}}
    onSearchOpen={() => {}}
    onNotificationsOpen={() => {}}
    onGamificationOpen={() => {}}
    onUserSettingsOpen={() => {}}
    onAdminPanelOpen={() => {}}
    currentUser={{ id: 1, name: 'Иван Петров', email: 'ivan@example.com' }}
    themeName="facebook"
    setThemeName={() => {}}
    onDebugUsers={() => {}}
    socket={null}
    setLeftSidebarOpen={() => {}}
    setRightSidebarOpen={() => {}}
    onShowPresentation={() => {}}
  />
);

export const WithoutUser = () => <AppBarPlaceholder />; 