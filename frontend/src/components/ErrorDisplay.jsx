import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Box, 
  Button, 
  Stack, 
  Typography, 
  Collapse,
  IconButton
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showActions = true, 
  variant = 'error',
  title,
  actions = []
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!error) return null;

  const getSeverity = () => {
    switch (variant) {
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'error';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'warning': return <WarningIcon />;
      case 'info': return <InfoIcon />;
      case 'success': return <InfoIcon />;
      default: return <ErrorIcon />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (variant) {
      case 'warning': return 'Предупреждение';
      case 'info': return 'Информация';
      case 'success': return 'Успешно';
      default: return 'Произошла ошибка';
    }
  };

  const defaultActions = [];
  
  if (onRetry) {
    defaultActions.push({
      label: 'Попробовать снова',
      icon: <RefreshIcon />,
      action: onRetry,
      variant: 'outlined'
    });
  }

  if (actions.length > 0) {
    defaultActions.push(...actions);
  }

  return (
    <Collapse in={!!error}>
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        action={
          <Stack direction="row" spacing={1}>
            {showActions && defaultActions.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {defaultActions.map((action, index) => (
                  <Button
                    key={index}
                    size="small"
                    variant={action.variant || 'outlined'}
                    startIcon={action.icon}
                    onClick={action.action}
                    sx={{ 
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      px: 1
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            )}
            {onDismiss && (
              <IconButton
                size="small"
                onClick={onDismiss}
                sx={{ p: 0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        }
        sx={{
          mb: 2,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
          {getTitle()}
        </AlertTitle>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          {error}
        </Typography>

        {variant === 'error' && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="text"
              startIcon={<HelpIcon />}
              onClick={() => setExpanded(!expanded)}
              sx={{ 
                fontSize: '0.75rem',
                p: 0,
                minWidth: 'auto',
                textTransform: 'none'
              }}
            >
              {expanded ? 'Скрыть детали' : 'Показать детали'}
            </Button>
            
            <Collapse in={expanded}>
              <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, fontSize: '0.75rem' }}>
                <Typography variant="caption" color="text.secondary">
                  Если проблема повторяется, попробуйте:
                </Typography>
                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                  <li>Обновить страницу (F5)</li>
                  <li>Проверить подключение к интернету</li>
                  <li>Очистить кэш браузера</li>
                  <li>Обратиться к администратору</li>
                </ul>
              </Box>
            </Collapse>
          </Box>
        )}
      </Alert>
    </Collapse>
  );
};

export default ErrorDisplay; 