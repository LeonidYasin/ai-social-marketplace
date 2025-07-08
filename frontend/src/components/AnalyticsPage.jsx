import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import Analytics from './Analytics';

const AnalyticsPage = ({ posts, userReactions, comments }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Аналитика
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Analytics
          open={true}
          onClose={() => {}} // Пустая функция для режима страницы
          posts={posts}
          userReactions={userReactions}
          comments={comments}
          isPageMode={true}
        />
      </Paper>
    </Box>
  );
};

export default AnalyticsPage; 