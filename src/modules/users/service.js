const prisma = require('../../core/database/client');
const { checkPermission } = require('../../core/utils/permissions');

class UserService {
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        gender: true,
        createdAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(userId, updateData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getUserById(userId, requestingUserId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        gender: true,
        createdAt: true,
        audios: {
          where: {
            access: 'Public',
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        statistics: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Обновляем статистику просмотров профиля
    if (requestingUserId !== userId) {
      await prisma.userStatistics.update({
        where: { userId },
        data: {
          profileViews: {
            increment: 1,
          },
        },
      });
    }

    return user;
  }

  async getUserStatistics(userId) {
    const statistics = await prisma.userStatistics.findUnique({
      where: { userId },
    });

    if (!statistics) {
      throw new Error('Statistics not found');
    }

    return statistics;
  }
}

module.exports = new UserService();