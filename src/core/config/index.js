const path = require('path');

const env = process.env.NODE_ENV || 'development';

require('dotenv').config({
  path: path.resolve(__dirname, `../../../.env.${env}`),
});

const config = {
  env,
  app: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3000,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET,
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      region: process.env.S3_REGION,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    },
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800,
    allowedAudioFormats: (process.env.ALLOWED_AUDIO_FORMATS || 'mp3,wav,ogg,flac,m4a,aac').split(','),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  },
  redis: {
    url: process.env.REDIS_URL,
  },
};

module.exports = config;