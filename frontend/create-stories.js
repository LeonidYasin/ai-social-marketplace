const fs = require('fs');
const path = require('path');

// Список компонентов, для которых нужно создать истории
const components = [
  'AdminPanel',
  'AdminPage', 
  'Analytics',
  'AnalyticsPage',
  'BackendStatus',
  'ChatDialog',
  'CreatePostPage',
  'ErrorDisplay',
  'Gamification',
  'GamificationPage',
  'LoggingTest',
  'MessageNotifications',
  'NotificationsPage',
  'OAuthSuccess',
  'ProfilePage',
  'SettingsPage',
  'UserSettings'
];

// Шаблон истории
const storyTemplate = (componentName) => `import React from 'react';
import ${componentName} from './${componentName}';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Создаем тему для MUI
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

export default {
  title: 'Components/${componentName}',
  component: ${componentName},
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
};

export const Default = () => {
  try {
    return <${componentName} />;
  } catch (error) {
    return <div>Error: {error.message}</div>;
  }
};
`;

// Создаем истории для каждого компонента
components.forEach(componentName => {
  const storyPath = path.join(__dirname, 'src', 'components', `${componentName}.stories.jsx`);
  
  // Проверяем, существует ли уже история
  if (!fs.existsSync(storyPath)) {
    console.log(`Creating story for ${componentName}...`);
    fs.writeFileSync(storyPath, storyTemplate(componentName));
  } else {
    console.log(`Story for ${componentName} already exists, skipping...`);
  }
});

console.log('Stories creation completed!'); 