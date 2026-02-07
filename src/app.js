const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const config = require('./core/config');
const corsMiddleware = require('./core/middleware/cors');
const errorHandler = require('./core/middleware/errorHandler');
const logger = require('./core/utils/logger');

const app = express();

// Swagger документация
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zoul Server API',
      version: '1.0.0',
      description: 'Backend API for audio platform',
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}${config.app.apiPrefix}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/modules/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API роуты
app.use(config.app.apiPrefix, require('./modules/auth'));
app.use(config.app.apiPrefix, require('./modules/users'));
app.use(config.app.apiPrefix, require('./modules/audio'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;