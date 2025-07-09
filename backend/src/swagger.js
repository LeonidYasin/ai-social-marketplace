const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Автоматически сгенерированная документация по API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Путь к вашим роутам для автосбора аннотаций
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec; 