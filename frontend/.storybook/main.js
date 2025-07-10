

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/preset-create-react-app",
    "@storybook/addon-docs"
  ],
  "framework": {
    "name": "@storybook/react-webpack5",
    "options": {}
  },
  "staticDirs": [
    "..\\public"
  ],
  "core": {
    "disableTelemetry": true
  },
  "webpackFinal": async (config) => {
    // Добавляем полифилл для process
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "process": require.resolve("process/browser"),
    };
    
    // Добавляем плагин для process
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    );
    
    // Исправляем разрешение модулей MUI
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/material': require.resolve('@mui/material'),
      '@mui/icons-material': require.resolve('@mui/icons-material'),
      '@emotion/react': require.resolve('@emotion/react'),
      '@emotion/styled': require.resolve('@emotion/styled'),
    };
    
    // Добавляем поддержку CSS-in-JS для MUI
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });
    
    return config;
  },
};
export default config;