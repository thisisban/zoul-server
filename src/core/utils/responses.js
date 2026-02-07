// src/core/utils/responses.js
/**
 * Успешный ответ API
 */
exports.success = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Ответ с ошибкой API
 */
exports.error = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  res.status(statusCode).json(response);
};