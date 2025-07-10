import React from 'react';
import Feed from './Feed';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const mockPosts = [
  {
    id: 1,
    title: 'Продаю iPhone 13 Pro',
    content: 'Телефон в идеальном состоянии, все функции работают отлично. В комплекте зарядное устройство и защитное стекло. Цена: 75,000 ₽',
    author: { id: 1, username: 'alex_ivanov', avatar: 'https://via.placeholder.com/40x40' },
    createdAt: new Date().toISOString(),
    likes: 24,
    comments: 8,
    image: 'https://via.placeholder.com/400x300'
  },
  {
    id: 2,
    title: 'Отдам книги по программированию',
    content: 'Отдам бесплатно книги по программированию. Кто заинтересован?',
    author: { id: 2, username: 'maria_sidorova', avatar: 'https://via.placeholder.com/40x40' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 15,
    comments: 12,
    image: null
  }
];

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
  title: 'Components/Feed',
  component: Feed,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Story />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => {
  try {
    return <Feed />;
  } catch (error) {
    return <div>Error: {error.message}</div>;
  }
};

export const WithMockData = () => {
  try {
    return <Feed posts={mockPosts} />;
  } catch (error) {
    return <div>Error: {error.message}</div>;
  }
};

export const Empty = () => {
  try {
    return <Feed posts={[]} />;
  } catch (error) {
    return <div>Error: {error.message}</div>;
  }
}; 