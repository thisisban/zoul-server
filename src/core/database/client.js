const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Обработка graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Middleware для логирования
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
  
  return result;
});

module.exports = prisma;