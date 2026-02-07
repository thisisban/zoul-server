const jwt = require('jsonwebtoken');
const config = require('../config');
const { error } = require('../utils/responses');
const prisma = require('../database/client');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Проверяем, не отозван ли токен
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return error(res, 'Token is invalid or expired', 401);
    }

    // Обновляем lastUsedAt
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    req.userId = decoded.userId;
    req.sessionId = decoded.sessionId;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token', 401);
    }
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired', 401);
    }
    return error(res, 'Authentication failed', 401);
  }
};