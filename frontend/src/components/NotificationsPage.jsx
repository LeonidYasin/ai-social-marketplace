import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import NotificationsManager from './Notifications';

const NotificationsPage = ({ currentUser }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Уведомления
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <NotificationsManager
          currentUser={currentUser}
          isPageMode={true}
        />
      </Paper>
    </Box>
  );
};

export default NotificationsPage; 