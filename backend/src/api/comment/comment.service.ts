import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { Prisma } from '@prisma/client';
import { getIo } from '../../utils/socket.js';

/**
 * Post uchun barcha izohlarni (javoblari bilan birga) oladi
 */
export const getCommentsByPostId = async (postId: string) => {
  const comments = await prisma.postComment.findMany({
    where: { postId, parentId: null }, // Faqat asosiy izohlarni olamiz
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      replies: {
        // Har bir izohning javoblarini ham olamiz
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  return comments;
};

/**
 * Yangi izoh yoki javob yaratadi
 */
export const createComment = async (
  input: Prisma.PostCommentUncheckedCreateInput,
  userId: string,
) => {
  const newComment = await prisma.postComment.create({
    data: {
      content: input.content,
      postId: input.postId,
      parentId: input.parentId,
      userId: userId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
      // replies: true, // Bu ortiqcha, chunki yangi izohda javob bo'lmaydi
    },
  });

  // Socket orqali real-time xabar yuborish
  const io = getIo();
  // Barcha shu postni kuzatib turganlarga xabar yuboramiz
  const room = `post_comments_${newComment.postId}`;
  io.to(room).emit('new_comment', newComment);

  return newComment;
};

/**
 * Izohni o'chiradi
 */
export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: { post: { include: { channel: true } } },
  });

  if (!comment) throw new ApiError(404, 'Izoh topilmadi.');

  // Faqat izoh egasi yoki kanal egasi o'chira oladi
  if (comment.userId !== userId && comment.post.channel.ownerId !== userId) {
    throw new ApiError(403, 'Sizda bu izohni o`chirishga ruxsat yo`q.');
  }

  // Avval javoblarni, keyin o'zini o'chiramiz
  await prisma.postComment.deleteMany({ where: { parentId: commentId } });
  await prisma.postComment.delete({ where: { id: commentId } });

  // Socket orqali o'chirilganlik haqida xabar yuborish
  const io = getIo();
  const room = `post_comments_${comment.postId}`;
  io.to(room).emit('comment_deleted', {
    commentId,
    parentId: comment.parentId,
  });
};
