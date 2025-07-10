import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Chip, 
  IconButton, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import backendManager from '../services/backendManager';

const HeartbeatLamp = ({ isConnected = true }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-block',
      width: 14,
      height: 14,
      borderRadius: '50%',
      bgcolor: isConnected ? '#4caf50' : '#f44336',
      boxShadow: isConnected 
        ? '0 0 0 0 rgba(76, 175, 80, 0.6)'
        : '0 0 0 0 rgba(244, 67, 54, 0.6)',
      animation: isConnected 
        ? 'pulseOnline 1.2s cubic-bezier(0.4,0,0.2,1) infinite'
        : 'pulseOffline 1.2s cubic-bezier(0.4,0,0.2,1) infinite',
      '@keyframes pulseOnline': {
        '0%':   { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.6)' },
        '10%':  { boxShadow: '0 0 0 8px rgba(76, 175, 80, 0)' },
        '12%':  { boxShadow: '0 0 0 8px rgba(76, 175, 80, 0)' },
        '100%': { boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)' },
      },
      '@keyframes pulseOffline': {
        '0%':   { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.6)' },
        '10%':  { boxShadow: '0 0 0 8px rgba(244, 67, 54, 0)' },
        '12%':  { boxShadow: '0 0 0 8px rgba(244, 67, 54, 0)' },
        '100%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' },
      },
      mr: 1
    }}
    aria-label={isConnected ? "backend-connected" : "backend-disconnected"}
    data-testid={isConnected ? "backend-connected-lamp" : "backend-disconnected-lamp"}
  />
);

const BackendStatus = () => {
  const [status, setStatus] = useState(backendManager.getBackendStatus());
  const [previousStatus, setPreviousStatus] = useState(backendManager.getBackendStatus());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Запускаем мониторинг здоровья
    backendManager.startHealthMonitoring();
    
    // Функция для проверки статуса
    const checkStatus = async () => {
      // Проверяем здоровье бэкенда
      await backendManager.checkBackendHealth();
      // Получаем новый статус
      const newStatus = backendManager.getBackendStatus();
      
      // Обновляем статусы только если они изменились
      if (newStatus.isRunning !== previousStatus.isRunning) {
        setPreviousStatus(status);
        setStatus(newStatus);
      } else {
        setStatus(newStatus);
      }
    };
    
    // Первоначальная проверка
    checkStatus();
    
    // Проверяем каждые 5 секунд
    const statusInterval = setInterval(checkStatus, 5000);
    
    return () => {
      clearInterval(statusInterval);
      backendManager.stopHealthMonitoring();
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await backendManager.retryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAutoStartToggle = (enabled) => {
    backendManager.configure({ autoStartEnabled: enabled });
    setStatus(backendManager.getBackendStatus());
  };

  const getStatusColor = () => {
    if (status.isRunning) return 'success';
    if (status.retryAttempts > 0) return 'warning';
    return 'error';
  };

  const getStatusIcon = () => {
    if (status.isRunning) return <CheckCircleIcon />;
    if (status.retryAttempts > 0) return <WarningIcon />;
    return <ErrorIcon />;
  };

  const getStatusText = () => {
    if (status.isRunning) return 'Подключен';
    if (status.retryAttempts > 0) return `Попытка ${status.retryAttempts}/${status.maxRetries}`;
    return 'Отключен';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={status.isRunning ? "Бэкенд подключен" : "Бэкенд отключен"}>
        <HeartbeatLamp isConnected={status.isRunning} />
      </Tooltip>
    </Box>
  );
};

export default BackendStatus; 