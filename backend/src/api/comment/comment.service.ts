import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { Prisma } from '@prisma/client';
import { getIo } from '../../utils/socket.js';

/**
 * Post uchun barcha izohlarni (javoblari bilan birga) oladi
 * Infinite nested replies uchun barcha izohlarni flat list sifatida olib, keyin nested structure yasaydi
 */
export const getCommentsByPostId = async (postId: string) => {
  // Barcha izohlarni olish (nested bo'lmagan holatda)
  const allComments = await prisma.postComment.findMany({
    where: { postId },
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
    },
  });

  // Nested structure yasash (infinite depth uchun)
  const buildNestedComments = (parentId: string | null = null): any[] => {
    return allComments
      .filter((comment) => comment.parentId === parentId)
      .map((comment) => ({
        ...comment,
        replies: buildNestedComments(comment.id),
      }));
  };

  return buildNestedComments(null);
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
    },
  });

  // Yangi izohni nested structure bilan qaytarish (infinite depth uchun)
  const commentWithReplies = {
    ...newComment,
    replies: [],
  };

  // Socket orqali real-time xabar yuborish
  const io = getIo();
  // Barcha shu postni kuzatib turganlarga xabar yuboramiz
  const room = `post_comments_${newComment.postId}`;

  console.log('🚀 Backend - Emitting new comment to room:', room);
  console.log('📝 Backend - Comment details:', {
    id: newComment.id,
    parentId: newComment.parentId,
    content: newComment.content,
    userId: newComment.userId,
    postId: newComment.postId,
  });

  // Socket event yuborish
  io.to(room).emit('new_comment', commentWithReplies);

  return commentWithReplies;
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
