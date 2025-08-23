import prisma from '../../config/db.config.js';
import { getIo } from '../../utils/socket.js';

/**
 * Postga reaksiya qo'shadi, o'zgartiradi yoki olib tashlaydi
 */
export const toggleReaction = async (
  postId: string,
  userId: string,
  emoji: string,
) => {
  const existingReaction = await prisma.postReaction.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  let reaction;
  if (existingReaction) {
    if (existingReaction.emoji === emoji) {
      // Agar o'sha emoji qayta bosilsa, reaksiyani o'chiramiz
      await prisma.postReaction.delete({ where: { id: existingReaction.id } });
      reaction = null; // Reaksiya olib tashlandi
    } else {
      // Agar boshqa emoji bosilsa, reaksiyani yangilaymiz
      reaction = await prisma.postReaction.update({
        where: { id: existingReaction.id },
        data: { emoji },
      });
    }
  } else {
    // Agar reaksiya mavjud bo'lmasa, yangisini yaratamiz
    reaction = await prisma.postReaction.create({
      data: { postId, userId, emoji },
    });
  }

  // Barcha reaksiyalarni qayta sanab, frontendga yuboramiz
  const reactionsCount = await prisma.postReaction.groupBy({
    by: ['emoji'],
    where: { postId },
    _count: {
      emoji: true,
    },
  });

  const io = getIo();
  const room = `post_reactions_${postId}`;
  io.to(room).emit('reactions_updated', { postId, reactions: reactionsCount });

  return reaction;
};
