import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AdminPanel from './AdminPanel';

const AdminPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Админская панель
      </Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <AdminPanel
          isPageMode={true}
        />
      </Paper>
    </Box>
  );
};

export default AdminPage; 