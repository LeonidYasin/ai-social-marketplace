import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { oauthAPI } from '../services/api';

const OAuthSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const userData = urlParams.get('user');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          setStatus('error');
          setError(decodeURIComponent(errorParam));
          return;
        }

        if (!token || !userData) {
          setStatus('error');
          setError('Не удалось получить данные авторизации');
          return;
        }

        // Обрабатываем успешный OAuth
        const result = await oauthAPI.handleOAuthSuccess(token, userData);
        setUser(result.user);
        setStatus('success');

        // Перенаправляем на главную страницу через 3 секунды
        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error) {
        console.error('OAuth success error:', error);
        setStatus('error');
        setError(error.message || 'Ошибка обработки авторизации');
      }
    };

    handleOAuthSuccess();
  }, [location, navigate]);

  const handleGoHome = () => {
    navigate('/');
  };

  if (status === 'loading') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Обработка авторизации...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Пожалуйста, подождите
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom color="error">
              Ошибка авторизации
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={handleGoHome}
              sx={{ mt: 2 }}
            >
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom color="success">
            Авторизация успешна!
          </Typography>
          
          {user && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 3 }}>
              <Avatar
                src={user.avatar_url}
                sx={{ width: 80, height: 80, mb: 2 }}
              >
                {user.first_name?.[0]}{user.last_name?.[0]}
              </Avatar>
              <Typography variant="h6">
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Stack>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Перенаправление на главную страницу...
          </Typography>
          
          <Button
            variant="contained"
            onClick={handleGoHome}
            sx={{ mt: 2 }}
          >
            Перейти сейчас
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OAuthSuccess; 