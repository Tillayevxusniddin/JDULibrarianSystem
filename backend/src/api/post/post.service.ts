import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { Prisma } from '@prisma/client';
import { deleteFromS3 } from '../../utils/s3.service.js';
import fs from 'fs';
import path from 'path';

export const createPost = async (
  input: Prisma.PostUncheckedCreateInput,
  userId: string,
) => {
  const channel = await prisma.channel.findUnique({
    where: { ownerId: userId },
  });
  if (!channel) {
    throw new ApiError(403, 'Post yaratish uchun sizda kanal bo`lishi kerak.');
  }

  // O'ZGARISH SHU YERDA
  return prisma.post.create({
    data: {
      ...input,
      channelId: channel.id,
      authorId: userId,
    },
    // QO'SHILGAN QISM: Frontendga to'liq ma'lumot yuborish uchun
    select: {
      id: true,
      content: true,
      postImage: true,
      createdAt: true,
      authorId: true,
      channelId: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      reactions: {
        select: {
          emoji: true,
          userId: true,
        },
      },
    },
  });
};

export const getPostsByChannelId = (channelId: string) => {
  return prisma.post.findMany({
    where: { channelId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      postImage: true,
      createdAt: true,
      authorId: true,
      channelId: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      // --- O'ZGARISH: Har bir postning reaksiyalarini ham qo'shib yuboramiz ---
      reactions: {
        select: {
          emoji: true,
          userId: true,
        },
      },
    },
  });
};

export const updatePost = async (
  postId: string,
  userId: string,
  data: Prisma.PostUpdateInput,
) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, 'Post topilmadi.');
  if (post.authorId !== userId)
    throw new ApiError(403, 'Faqat o`z postlaringizni tahrirlay olasiz.');

  const oldPostImage = post.postImage;

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data,
    select: {
      id: true,
      content: true,
      postImage: true,
      createdAt: true,
      authorId: true,
      channelId: true,
      author: {
        select: { firstName: true, lastName: true, profilePicture: true },
      },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  // Agar yangi rasm yuklangan bo'lsa, eskisini S3'dan o'chiramiz
  if (data.postImage && oldPostImage) {
    await deleteFromS3(oldPostImage);
  }

  return updatedPost;
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, 'Post topilmadi.');
  if (post.authorId !== userId)
    throw new ApiError(403, 'Faqat o`z postlaringizni o`chira olasiz.');

  const imagePath = post.postImage;

  // Avval bazadan o'chiramiz
  await prisma.post.delete({ where: { id: postId } });

  // Keyin S3'dan o'chiramiz
  if (imagePath) {
    await deleteFromS3(imagePath);
  }
};

export const getMyPosts = async (userId: string) => {
  return prisma.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      postImage: true,
      createdAt: true,
      authorId: true,
      channelId: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          linkName: true,
          logoImage: true,
        },
      },
      reactions: {
        select: {
          emoji: true,
          userId: true,
        },
      },
    },
  });
};

export const getAllPosts = async () => {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      postImage: true,
      createdAt: true,
      authorId: true,
      channelId: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          linkName: true,
          logoImage: true,
        },
      },
      reactions: {
        select: {
          emoji: true,
          userId: true,
        },
      },
    },
  });
};

export const getPostById = async (postId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      content: true,
      postImage: true,
      createdAt: true,
      authorId: true,
      channelId: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          linkName: true,
          logoImage: true,
        },
      },
      reactions: {
        select: {
          emoji: true,
          userId: true,
        },
      },
    },
  });

  if (!post) {
    throw new ApiError(404, 'Post topilmadi');
  }

  return post;
};
