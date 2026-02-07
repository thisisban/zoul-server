const prisma = require('../../core/database/client');
const { checkPermission } = require('../../core/utils/permissions');
const storageService = require('./upload');

class AudioService {
  async uploadAudio(userId, file, metadata) {
    const {
      displayName,
      description,
      tags = [],
      access = 'Public',
      isExplicit = false,
    } = metadata;

    // Загружаем файл в хранилище
    const uploadResult = await storageService.uploadAudio(file);

    // Создаем запись в базе данных
    const audio = await prisma.audio.create({
      data: {
        ownerId: userId,
        displayName,
        description,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        duration: uploadResult.duration,
        format: uploadResult.format,
        access,
        isExplicit,
        tags: {
          create: tags.map(tag => ({ tag })),
        },
        statistics: {
          create: {},
        },
      },
      include: {
        tags: true,
      },
    });

    // Обновляем статистику пользователя
    await prisma.userStatistics.update({
      where: { userId },
      data: {
        totalUploads: {
          increment: 1,
        },
      },
    });

    return audio;
  }

  async getAudioList(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = pagination;

    const {
      userId,
      tag,
      search,
      access = 'Public',
      minDuration,
      maxDuration,
      dateFrom,
      dateTo,
    } = filters;

    const where = {
      access,
    };

    if (userId) {
      where.ownerId = userId;
    }

    if (tag) {
      where.tags = {
        some: { tag },
      };
    }

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minDuration || maxDuration) {
      where.duration = {};
      if (minDuration) where.duration.gte = parseInt(minDuration);
      if (maxDuration) where.duration.lte = parseInt(maxDuration);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const total = await prisma.audio.count({ where });

    const audios = await prisma.audio.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        tags: true,
        statistics: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [orderBy]: orderDir,
      },
    });

    return {
      data: audios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAudioById(audioId, userId = null) {
    const audio = await prisma.audio.findUnique({
      where: { id: audioId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        tags: true,
        statistics: true,
        votes: {
          where: userId ? { userId } : undefined,
          take: 1,
        },
      },
    });

    if (!audio) {
      throw new Error('Audio not found');
    }

    // Проверка доступа
    if (audio.access === 'Private' && audio.ownerId !== userId) {
      throw new Error('Access denied');
    }

    if (audio.access === 'Noone' && audio.ownerId !== userId) {
      throw new Error('Access denied');
    }

    return audio;
  }

  async recordListen(audioId, userId = null) {
    const audio = await prisma.audio.findUnique({
      where: { id: audioId },
      include: { statistics: true },
    });

    if (!audio) {
      throw new Error('Audio not found');
    }

    // Обновляем статистику аудио
    await prisma.audioStatistics.update({
      where: { audioId },
      data: {
        listens: {
          increment: 1,
        },
        lastListenedAt: new Date(),
      },
    });

    // Обновляем статистику пользователя (если авторизован)
    if (userId) {
      await prisma.userStatistics.update({
        where: { userId },
        data: {
          totalListens: {
            increment: 1,
          },
        },
      });
    }

    return { success: true };
  }

  async voteAudio(audioId, userId, voteValue) {
    // Проверяем, существует ли уже голос
    const existingVote = await prisma.audioVote.findUnique({
      where: {
        userId_audioId: {
          userId,
          audioId,
        },
      },
    });

    let vote;
    if (existingVote) {
      // Обновляем существующий голос
      vote = await prisma.audioVote.update({
        where: {
          userId_audioId: {
            userId,
            audioId,
          },
        },
        data: {
          vote: voteValue,
          votedAt: new Date(),
        },
      });
    } else {
      // Создаем новый голос
      vote = await prisma.audioVote.create({
        data: {
          userId,
          audioId,
          vote: voteValue,
        },
      });
    }

    // Пересчитываем рейтинг аудио
    await this.updateAudioRating(audioId);

    return vote;
  }

  async updateAudioRating(audioId) {
    const votes = await prisma.audioVote.aggregate({
      where: { audioId },
      _sum: { vote: true },
      _count: { vote: true },
    });

    const rating = votes._sum.vote || 0;

    await prisma.audioStatistics.update({
      where: { audioId },
      data: { rating },
    });

    return rating;
  }

  async updateAudio(audioId, userId, updateData) {
    // Проверяем права доступа
    const audio = await prisma.audio.findUnique({
      where: { id: audioId },
    });

    if (!audio) {
      throw new Error('Audio not found');
    }

    if (audio.ownerId !== userId) {
      const hasPermission = await checkPermission(userId, 'audio.manage');
      if (!hasPermission) {
        throw new Error('Permission denied');
      }
    }

    const updatedAudio = await prisma.audio.update({
      where: { id: audioId },
      data: updateData,
      include: {
        tags: true,
      },
    });

    return updatedAudio;
  }

  async deleteAudio(audioId, userId) {
    // Проверяем права доступа
    const audio = await prisma.audio.findUnique({
      where: { id: audioId },
    });

    if (!audio) {
      throw new Error('Audio not found');
    }

    if (audio.ownerId !== userId) {
      const hasPermission = await checkPermission(userId, 'audio.manage');
      if (!hasPermission) {
        throw new Error('Permission denied');
      }
    }

    // Удаляем файл из хранилища
    await storageService.deleteFile(audio.fileUrl);

    // Удаляем запись из базы данных
    await prisma.audio.delete({
      where: { id: audioId },
    });

    return { success: true };
  }
}

module.exports = new AudioService();