import prisma from '../../config/db.config.js';
import { Role } from '@prisma/client';

/**
 * Kutubxonachi uchun kengaytirilgan statistikani hisoblaydi
 */
export const getLibrarianStats = async () => {
  // Barcha so'rovlarni bitta tranzaksiyada, parallel ravishda bajaramiz
  const [
    totalBookTitles, // Jami kitob nomlari (pasportlar) soni
    totalBookCopies, // Jami jismoniy nusxalar soni
    borrowedCopies, // Ijaradagi nusxalar soni
    availableCopies, // Bo'sh (ijaraga olish mumkin bo'lgan) nusxalar soni
    totalUsers, // Tizimdagi jami foydalanuvchilar soni
    newSuggestions, // Yangi kitob takliflari soni
  ] = await prisma.$transaction([
    prisma.book.count(),
    prisma.bookCopy.count(),
    prisma.bookCopy.count({ where: { status: 'BORROWED' } }),
    prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.bookSuggestion.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalBookTitles,
    totalBookCopies,
    borrowedCopies,
    availableCopies,
    totalUsers,
    newSuggestions,
  };
};

/**
 * Oddiy foydalanuvchi uchun statistikani hisoblaydi
 * @param userId Foydalanuvchining IDsi
 */
export const getUserStats = async (userId: string) => {
  // Bu funksiya o'zgarishsiz qoladi, chunki Loan va Reservation
  // jadvallarida userId bilan to'g'ridan-to'g'ri bog'liqlik mavjud.
  const [activeLoans, activeReservations] = await prisma.$transaction([
    prisma.loan.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.reservation.count({
      where: { userId, status: { in: ['ACTIVE', 'AWAITING_PICKUP'] } },
    }),
  ]);

  return { activeLoans, activeReservations };
};
