import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Gamification from './Gamification';

const GamificationPage = ({ userStats }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Геймификация
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Gamification
          open={true}
          onClose={() => {}} // Пустая функция для режима страницы
          userStats={userStats}
          isPageMode={true}
        />
      </Paper>
    </Box>
  );
};

export default GamificationPage; 