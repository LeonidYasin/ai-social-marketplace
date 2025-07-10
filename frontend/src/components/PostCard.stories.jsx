import React from 'react';
import PostCard from './PostCard';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const mockPost = {
  id: 1,
  title: 'Продаю iPhone 13 Pro в отличном состоянии',
  content: 'Телефон в идеальном состоянии, все функции работают отлично. В комплекте зарядное устройство и защитное стекло. Цена: 75,000 ₽',
  author: {
    id: 1,
    username: 'alex_ivanov',
    avatar: 'https://via.placeholder.com/40x40'
  },
  createdAt: new Date().toISOString(),
  likes: 24,
  comments: 8,
  image: 'https://via.placeholder.com/400x300'
};

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
  title: 'Components/PostCard',
  component: PostCard,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <div style={{ maxWidth: '500px', margin: '20px' }}>
            <Story />
          </div>
        </BrowserRouter>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    post: { control: 'object' },
  },
};

export const Default = () => {
  try {
    return <PostCard post={mockPost} />;
  } catch (error) {
    return <div>Error: {error.message}</div>;
  }
};

export const WithoutImage = () => {
  try {
    return (
      <PostCard 
        post={{
          ...mockPost,
          image: null
        }} 
      />
    );
  } catch (error) {
    return <div>Error: {error.message}</div>;
  }
};

export const LongContent = () => {
  try {
    return (
      <PostCard 
        post={{
          ...mockPost,
          content: 'Это очень длинный текст поста, который демонстрирует, как компонент PostCard обрабатывает переполнение текста и перенос строк. Он должен показывать многоточие или правильное обрезание текста, когда содержимое превышает доступное пространство.'
        }} 
      />
    );
  } catch (error) {
    return <div>Error: {error.message}</div>;
  }
}; 