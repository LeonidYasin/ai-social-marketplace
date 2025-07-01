import { createTheme } from '@mui/material/styles';

export const facebookTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1877f2' },
    secondary: { main: '#42b72a' },
    background: { default: '#f0f2f5', paper: '#fff' },
    text: { primary: '#050505', secondary: '#65676b' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  shape: { borderRadius: 8 },
});

export const neonTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00ffe7' },
    secondary: { main: '#ff00c8' },
    background: { default: '#181a20', paper: '#23272f' },
    text: { primary: '#f8f8ff', secondary: '#b2fefa' },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
    fontWeightBold: 700,
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: '0 0 12px #00ffe7, 0 0 4px #ff00c8',
          borderRadius: 16,
          textTransform: 'uppercase',
          transition: 'box-shadow 0.2s, background 0.2s',
          '&:hover': {
            boxShadow: '0 0 24px #00ffe7, 0 0 8px #ff00c8',
            background: 'linear-gradient(90deg, #00ffe7 0%, #ff00c8 100%)',
            color: '#181a20',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #23272f 60%, #181a20 100%)',
          boxShadow: '0 2px 24px #00ffe733, 0 0 16px #00ffe755',
          border: '1.5px solid #00ffe7',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'background 0.2s, box-shadow 0.2s',
          '&:hover': {
            background: 'linear-gradient(90deg, #23272f 60%, #00ffe720 100%)',
            boxShadow: '0 0 12px #00ffe7',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#00ffe7',
              boxShadow: '0 0 8px #00ffe7',
            },
            '&:hover fieldset': {
              borderColor: '#ff00c8',
              boxShadow: '0 0 16px #ff00c8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00ffe7',
              boxShadow: '0 0 16px #00ffe7',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 0 0 2px #00ffe7, 0 0 8px #ff00c8',
          transition: 'box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 0 0 4px #ff00c8, 0 0 16px #00ffe7',
          },
        },
      },
    },
  },
}); 