import React from 'react';
import { Box, Typography, Paper, useMediaQuery, useTheme } from '@mui/material';
import UserSettings from './UserSettings';

const SettingsPage = ({ currentUser, setCurrentUser, fetchUsers, posts = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ 
      p: { xs: 0.5, sm: 2, md: 3 },
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      minHeight: '100vh',
      '& *': {
        maxWidth: '100% !important'
      },
      '& .MuiPaper-root': {
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      },
      '& .MuiBox-root': {
        width: '100%',
        maxWidth: '100%'
      },
      '& .MuiCard-root': {
        width: '100%',
        maxWidth: '100%'
      },
      '& .MuiGrid-root': {
        width: '100%'
      },
      '& .MuiFormControl-root': {
        width: '100%',
        maxWidth: '100%'
      },
      '& .MuiTextField-root': {
        width: '100%'
      },
      '& .MuiSelect-root': {
        width: '100%'
      },
      '& .MuiStack-root': {
        width: '100%'
      },
      '& .MuiTabs-root': {
        width: '100%'
      },
      '& .MuiTab-root': {
        minWidth: 'auto !important',
        flex: '0 0 auto !important'
      },
      '& .MuiTabs-flexContainer': {
        flexWrap: 'wrap !important',
        gap: '4px !important'
      }
    }}>
      <Typography 
        variant={isMobile ? "h6" : "h4"} 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.25rem', sm: '2rem' },
          mb: { xs: 1, sm: 2 },
          px: { xs: 1, sm: 0 }
        }}
      >
        Настройки
      </Typography>
      <Paper sx={{ 
        p: { xs: 0.5, sm: 2 },
        mt: { xs: 1, sm: 2 },
        width: '100%',
        maxWidth: '100%',
        overflow: 'auto',
        minHeight: { xs: 'calc(100vh - 100px)', sm: 'auto' },
        '& *': {
          maxWidth: '100% !important'
        },
        '& .MuiBox-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiCard-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiGrid-root': {
          width: '100%'
        },
        '& .MuiFormControl-root': {
          width: '100%',
          maxWidth: '100%'
        },
        '& .MuiTextField-root': {
          width: '100%'
        },
        '& .MuiSelect-root': {
          width: '100%'
        },
        '& .MuiStack-root': {
          width: '100%'
        },
        '& .MuiTabs-root': {
          width: '100%'
        },
        '& .MuiTab-root': {
          minWidth: 'auto !important'
        }
      }}>
        <UserSettings
          onUserChange={(user) => {
            setCurrentUser(user);
            setTimeout(() => fetchUsers(), 1000);
          }}
          posts={posts}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          isPageMode={true}
        />
      </Paper>
    </Box>
  );
};

export default SettingsPage; 