// src/core/middleware/errorHandler.js
const logger = require('../utils/logger');

/**
 * Глобальный обработчик ошибок для Express
 */
module.exports = (err, req, res, next) => {
  // Логируем ошибку с полным стектрейсом
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });

  // Определяем HTTP-статус ошибки
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  // Формируем ответ
  const response = {
    success: false,
    message: message,
    // Показываем стектрейс только в режиме разработки
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Отправляем JSON-ответ
  res.status(statusCode).json(response);
};