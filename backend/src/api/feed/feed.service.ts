import prisma from '../../config/db.config.js';

export const getUserFeed = async (
  userId: string,
  pagination: { page: number; limit: number },
) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // 1. Foydalanuvchi obuna bo'lgan barcha kanallarning ID'larini topamiz
  const followedChannels = await prisma.follow.findMany({
    where: { userId },
    select: { channelId: true },
  });

  const followedChannelIds = followedChannels.map((f) => f.channelId);

  if (followedChannelIds.length === 0) {
    return { data: [], total: 0 }; // Agar obunalari bo'lmasa, bo'sh lenta qaytaramiz
  }

  // 2. O'sha kanallardagi barcha postlarni topamiz
  const where = {
    channelId: { in: followedChannelIds },
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }, // Eng yangilari birinchi
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        channel: { select: { id: true, name: true, linkName: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { data: posts, total };
};
