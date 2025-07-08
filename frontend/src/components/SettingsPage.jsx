import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import UserSettings from './UserSettings';

const SettingsPage = ({ currentUser, setCurrentUser, fetchUsers, posts = [] }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Настройки
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <UserSettings
          open={true}
          onClose={() => {}} // Пустая функция, так как мы не закрываем модальное окно
          onUserChange={(user) => {
            setCurrentUser(user);
            setTimeout(() => fetchUsers(), 1000);
          }}
          posts={posts}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          isPageMode={true} // Новый проп для режима страницы
        />
      </Paper>
    </Box>
  );
};

export default SettingsPage; 