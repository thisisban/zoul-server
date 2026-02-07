const app = require('./src/app');
const config = require('./src/core/config');
const logger = require('./src/core/utils/logger');

const server = app.listen(config.app.port, config.app.host, () => {
  logger.info(`Server is running on http://${config.app.host}:${config.app.port}`);
  logger.info(`API documentation available at http://${config.app.host}:${config.app.port}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

module.exports = server;