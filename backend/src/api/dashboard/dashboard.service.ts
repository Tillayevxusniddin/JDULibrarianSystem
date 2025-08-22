import prisma from '../../config/db.config.js';
import { Role } from '@prisma/client';

/**
 * Kutubxonachi uchun statistikani hisoblaydi
 */
export const getLibrarianStats = async () => {
  const [totalBooks, totalUsers, newSuggestions] = await prisma.$transaction([
    prisma.book.count(),
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.bookSuggestion.count({ where: { status: 'PENDING' } }),
  ]);

  return { totalBooks, totalUsers, newSuggestions };
};

/**
 * Oddiy foydalanuvchi uchun statistikani hisoblaydi
 * @param userId Foydalanuvchining IDsi
 */
export const getUserStats = async (userId: string) => {
  const [activeLoans, activeReservations] = await prisma.$transaction([
    prisma.loan.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.reservation.count({
      where: { userId, status: { in: ['ACTIVE', 'AWAITING_PICKUP'] } },
    }),
  ]);

  return { activeLoans, activeReservations };
};
