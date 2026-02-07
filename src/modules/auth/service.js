const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../core/config');
const prisma = require('../../core/database/client');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  async register(userData) {
    const { username, email, password, displayName } = userData;

    // Проверяем существование пользователя
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName,
        statistics: {
          create: {},
        },
      },
    });

    // Назначаем роль Authenticated (order: 1)
    const authenticatedRole = await prisma.role.findUnique({
      where: { order: 1 },
    });

    if (authenticatedRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: authenticatedRole.id,
        },
      });
    }

    // Создаем сессию и токены
    const { accessToken, refreshToken } = await this.createSession(user.id);

    return { user, accessToken, refreshToken };
  }

  async login(username, password, ipAddress, userAgent) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isBanned) {
      throw new Error('User is banned');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Создаем сессию и токены
    const { accessToken, refreshToken } = await this.createSession(
      user.id,
      ipAddress,
      userAgent
    );

    // Обновляем статистику
    await prisma.userStatistics.update({
      where: { userId: user.id },
      data: { lastActiveAt: new Date() },
    });

    return { user, accessToken, refreshToken };
  }

  async logout(sessionId) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  async refresh(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.secret);
    } catch (err) {
      throw new Error('Invalid refresh token');
    }

    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new Error('Refresh token is invalid or expired');
    }

    // Создаем новую сессию и токены
    const { accessToken, refreshToken: newRefreshToken } = await this.createSession(
      session.userId,
      session.ipAddress,
      session.userAgent,
      true
    );

    // Отзываем старую сессию
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async createSession(userId, ipAddress = null, userAgent = null, isRefresh = false) {
    const sessionId = uuidv4();
    const accessToken = jwt.sign(
      { userId, sessionId },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry }
    );
    const refreshToken = jwt.sign(
      { userId, sessionId },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        tokenHash: refreshToken, // В реальном приложении нужно хэшировать
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();