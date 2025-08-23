import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
/**
 * Foydalanuvchi uchun yangi kanal yaratadi
 */
export const createChannel = async (
  input: Prisma.ChannelUncheckedCreateInput,
  userId: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isPremium) {
    throw new ApiError(403, 'Faqat premium foydalanuvchilar kanal ocha oladi.');
  }

  const existingChannel = await prisma.channel.findUnique({
    where: { ownerId: userId },
  });
  if (existingChannel) {
    throw new ApiError(409, 'Sizda allaqachon kanal mavjud.');
  }

  const existingLinkName = await prisma.channel.findUnique({
    where: { linkName: input.linkName },
  });
  if (existingLinkName) {
    throw new ApiError(
      409,
      'Bu havola nomi band. Iltimos, boshqasini tanlang.',
    );
  }

  return prisma.channel.create({
    data: {
      ...input,
      ownerId: userId,
    },
  });
};

/**
 * Tizimga kirgan foydalanuvchining shaxsiy kanalini topadi
 */
export const getMyChannel = (userId: string) => {
  return prisma.channel.findUnique({
    where: { ownerId: userId },
    // QO'SHIMCHA: Kanal ma'lumotlarini to'liqroq qaytarish uchun
    include: {
      _count: {
        select: {
          followers: true, // Kanal obunachilari soni
          posts: true, // Kanaldagi postlar soni
        },
      },
    },
  });
};

/**
 * Kanalni havola nomi orqali topadi (hamma uchun ochiq)
 */
export const getChannelByLinkName = async (
  linkName: string,
  currentUserId?: string,
) => {
  const channel = await prisma.channel.findUnique({
    where: { linkName },
    include: {
      _count: { select: { followers: true } }, // Obunachilar sonini sanaymiz
      owner: {
        select: { firstName: true, lastName: true, profilePicture: true },
      },
      posts: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
          reactions: { select: { emoji: true, userId: true } },
        },
      },
    },
  });

  if (!channel) return null;

  // Agar so'rov yuborayotgan foydalanuvchi tizimga kirgan bo'lsa,
  // uning shu kanalga obuna bo'lganini tekshiramiz.
  let isFollowed = false;
  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        channelId_userId: { channelId: channel.id, userId: currentUserId },
      },
    });
    isFollowed = !!follow;
  }

  return { ...channel, isFollowed };
};

/**
 * Kanal ma'lumotlarini yangilaydi
 */
export const updateMyChannel = async (
  userId: string,
  data: Prisma.ChannelUpdateInput,
) => {
  const channel = await prisma.channel.findUnique({
    where: { ownerId: userId },
  });
  if (!channel) {
    throw new ApiError(404, 'Sizga tegishli kanal topilmadi.');
  }

  // Agar yangi logotip yuklangan bo'lsa va eski logotip mavjud bo'lsa, eskisini o'chiramiz
  if (data.logoImage && channel.logoImage) {
    try {
      const oldLogoPath = path.join(
        process.cwd(),
        channel.logoImage.substring(1),
      );
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    } catch (err) {
      console.error(`Eski logotipni o'chirishda xatolik: ${err}`);
    }
  }

  return prisma.channel.update({
    where: { ownerId: userId },
    data,
  });
};

/**
 * Kanalni o'chiradi
 */
export const deleteMyChannel = (userId: string) => {
  // Prisma sxemasidagi "onDelete: Cascade" tufayli, kanal o'chirilganda
  // unga tegishli barcha postlar, izohlar, reaksiyalar va obunalar ham avtomatik o'chiriladi.
  return prisma.channel.delete({
    where: { ownerId: userId },
  });
};

export const toggleFollow = async (channelId: string, userId: string) => {
  const followData = { channelId, userId };
  const existingFollow = await prisma.follow.findUnique({
    where: { channelId_userId: followData },
  });

  if (existingFollow) {
    // Agar obuna mavjud bo'lsa, uni o'chiramiz (unfollow)
    await prisma.follow.delete({ where: { id: existingFollow.id } });
    return { followed: false };
  } else {
    // Agar obuna mavjud bo'lmasa, uni yaratamiz (follow)
    await prisma.follow.create({ data: followData });
    return { followed: true };
  }
};

export const getFollowedChannels = async (userId: string) => {
  const follows = await prisma.follow.findMany({
    where: { userId },
    include: {
      channel: {
        // Har bir obuna orqali uning kanal ma'lumotlarini olamiz
        include: {
          owner: {
            // Kanal egasining ma'lumotlari
            select: { firstName: true, lastName: true },
          },
          _count: {
            // Kanal obunachilari soni
            select: { followers: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Natijani to'g'ridan-to'g'ri kanal obyektlari ro'yxati qilib qaytaramiz
  return follows.map((follow) => follow.channel);
};

export const findAllChannels = async (
  query: { search?: string },
  pagination: { page: number; limit: number },
) => {
  const { search } = query;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.ChannelWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { linkName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [channels, total] = await prisma.$transaction([
    prisma.channel.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { followers: true } },
      },
    }),
    prisma.channel.count({ where }),
  ]);

  return { data: channels, total };
};
