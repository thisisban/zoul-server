// src/core/utils/logger.js
const winston = require('winston');
const path = require('path');
const config = require('../config');

// Определяем форматы логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Определяем транспорты (куда пишем логи)
const transports = [];

// Консольный транспорт
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
      level: config.app.logLevel || 'info',
    })
  );
}

// Файловый транспорт
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../../logs/error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../../logs/combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );
}

// Создаем логгер
const logger = winston.createLogger({
  level: config.app.logLevel || 'info',
  levels: winston.config.npm.levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Создаем папку для логов, если её нет
const fs = require('fs');
const logDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Простой интерфейс для быстрого использования
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;