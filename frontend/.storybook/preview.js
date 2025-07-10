/** @type { import('@storybook/react').Preview } */
// import { ThemeProvider, createTheme } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';

// Полифилл для process.env в Storybook
if (typeof process === 'undefined') {
  window.process = {
    env: {
      REACT_APP_API_URL: 'http://localhost:8000',
      REACT_APP_BACKEND_URL: 'http://localhost:8000',
      NODE_ENV: 'development'
    }
  };
}

// Создаем тему для MUI
// const theme = createTheme({
//   palette: {
//     mode: 'light',
//   },
// });

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  // decorators: [
  //   (Story) => (
  //     <ThemeProvider theme={createTheme()}>
  //       <CssBaseline />
  //       <Story />
  //     </ThemeProvider>
  //   ),
  // ],
};

export default preview;