const cors = require('cors');
const config = require('../config');

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, от мобильных приложений)
    if (!origin) return callback(null, true);
    
    // Проверяем, есть ли origin в списке разрешенных
    if (config.cors.origins.includes(origin)) {
      return callback(null, true);
    }
    
    // Проверяем локальные адреса
    const isLocalAddress = /^(http:\/\/)?(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|dell\.local)(:\d+)?$/.test(origin);
    if (isLocalAddress) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

module.exports = cors(corsOptions);