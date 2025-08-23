import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { Prisma } from '@prisma/client';
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

  // Agar yangi rasm yuklangan bo'lsa (`data.postImage` mavjud bo'lsa)
  // va eski rasm mavjud bo'lib, u standart rasm bo'lmasa, eskisini o'chiramiz.
  if (
    data.postImage &&
    post.postImage &&
    post.postImage !== '/public/uploads/posts/defaultpost.png'
  ) {
    try {
      const oldImagePath = path.join(
        process.cwd(),
        post.postImage.substring(1),
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    } catch (err) {
      console.error(`Eski post rasmini o'chirishda xatolik: ${err}`);
    }
  }

  return prisma.post.update({
    where: { id: postId },
    data,
    // Frontendga yangilangan postni to'liq qaytaramiz
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
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(404, 'Post topilmadi.');
  if (post.authorId !== userId)
    throw new ApiError(403, 'Faqat o`z postlaringizni o`chira olasiz.');

  const imagePath = post.postImage;

  await prisma.post.delete({ where: { id: postId } });

  // Post o'chirilgandan so'ng uning rasmini ham o'chiramiz
  if (imagePath && imagePath !== '/public/uploads/posts/defaultpost.png') {
    try {
      const fullPath = path.join(process.cwd(), imagePath.substring(1));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error(`Failed to delete post image ${imagePath}:`, err);
    }
  }
};
