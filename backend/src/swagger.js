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
        url: 'http://localhost:8000',
        description: 'Backend server',
      },
    ],
  },
  apis: [__dirname + '/routes/*.js'], // Абсолютный путь к роутам для автосбора аннотаций
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec; 