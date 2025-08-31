import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import redisClient from '@/config/redis.config.js';
import { getIo } from '../../utils/socket.js';
import { NotificationType } from '@prisma/client';

/**
 * Rezervatsiyani bajaradi (foydalanuvchi kitobni olib ketganda).
 */
export const fulfillReservation = async (reservationId: string) => {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });
    if (
      !reservation ||
      reservation.status !== 'AWAITING_PICKUP' ||
      !reservation.assignedCopyId
    ) {
      throw new ApiError(400, 'Bu rezervatsiya olib ketish uchun tayyor emas.');
    }

    await redisClient.del(`book:${reservation.bookId}`);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const newLoan = await tx.loan.create({
      data: {
        bookCopyId: reservation.assignedCopyId,
        userId: reservation.userId,
        dueDate,
        status: 'ACTIVE',
      },
    });

    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: 'FULFILLED' },
    });

    // Statusni to'g'ri 'BORROWED'ga o'zgartiramiz
    await tx.bookCopy.update({
      where: { id: reservation.assignedCopyId },
      data: { status: 'BORROWED' },
    });

    return newLoan;
  });
};

/**
 * Barcha aktiv rezervatsiyalar ro'yxatini oladi
 */
export const findAllReservations = async () => {
  return prisma.reservation.findMany({
    where: {
      status: { in: ['ACTIVE', 'AWAITING_PICKUP'] },
    },
    include: {
      book: { select: { id: true, title: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { reservedAt: 'desc' },
  });
};

/**
 * Foydalanuvchining aktiv rezervatsiyalarini oladi
 */
export const findUserReservations = (userId: string) => {
  return prisma.reservation.findMany({
    where: { userId, status: { notIn: ['FULFILLED', 'EXPIRED', 'CANCELLED'] } },
    include: { book: true },
    orderBy: { reservedAt: 'desc' },
  });
};

/**
 * Rezervatsiyani bekor qilish
 */
export const cancelReservation = async (
  reservationId: string,
  requestorId: string,
  requestorRole: string,
) => {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new ApiError(404, 'Rezervatsiya topilmadi.');
    await redisClient.del(`book:${reservation.bookId}`);
    if (reservation.userId !== requestorId && requestorRole !== 'LIBRARIAN') {
      throw new ApiError(
        403,
        "Faqat o'zingizning rezervatsiyangizni bekor qila olasiz.",
      );
    }

    await tx.reservation.delete({ where: { id: reservationId } });

    if (
      reservation.status === 'AWAITING_PICKUP' &&
      reservation.assignedCopyId
    ) {
      const nextInQueue = await tx.reservation.findFirst({
        where: { bookId: reservation.bookId, status: 'ACTIVE' },
        orderBy: { reservedAt: 'asc' },
        include: { book: true },
      });

      if (nextInQueue) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);
        await tx.reservation.update({
          where: { id: nextInQueue.id },
          data: {
            status: 'AWAITING_PICKUP',
            expiresAt,
            assignedCopyId: reservation.assignedCopyId,
          },
        });
        // Nusxa keyingi odamga o'tdi, statusi o'zgarmaydi
      } else {
        // Navbatda hech kim yo'q, nusxani bo'shatamiz
        await tx.bookCopy.update({
          where: { id: reservation.assignedCopyId },
          data: { status: 'AVAILABLE' },
        });
      }
    }
  });
};
