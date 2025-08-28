// src/api/reservation/reservation.service.ts
import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { getIo as getReservationIo } from '../../utils/socket.js';
import { recomputeBookStatus } from '../../utils/bookStatus.js';

export const fulfillReservation = async (reservationId: string) => {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.status !== 'AWAITING_PICKUP') {
      throw new ApiError(400, 'This reservation is not awaiting pickup.');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const newLoan = await tx.loan.create({
      data: {
        bookId: reservation.bookId,
        userId: reservation.userId,
        dueDate,
        status: 'ACTIVE',
      },
    });

    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: 'FULFILLED' },
    });

    // Copy was already held when moving to AWAITING_PICKUP; just recompute status
    await recomputeBookStatus(tx as any, reservation.bookId);

    return newLoan;
  });
};

export const findAllReservations = async () => {
  return prisma.reservation.findMany({
    where: {
      // Faqat aktiv va olib ketish kutilayotgan rezervatsiyalarni ko'rsatamiz
      status: { in: ['ACTIVE', 'AWAITING_PICKUP'] },
    },
    include: {
      book: { select: { id: true, title: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { reservedAt: 'desc' },
  });
};

export const findUserReservations = (userId: string) => {
  return prisma.reservation.findMany({
    where: { userId, status: { notIn: ['FULFILLED', 'EXPIRED', 'CANCELLED'] } },
    include: { book: true },
    orderBy: { reservedAt: 'desc' },
  });
};

export const cancelReservation = async (
  reservationId: string,
  requestorId: string,
  requestorRole: string,
) => {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found.');
    }

    if (reservation.userId !== requestorId && requestorRole !== 'LIBRARIAN') {
      throw new ApiError(403, 'You can only cancel your own reservations.');
    }

    // Yozuvni butunlay o'chiramiz
    await tx.reservation.delete({ where: { id: reservationId } });

    // Agar bekor qilingan rezervatsiya "Olib ketish kutilmoqda" statusida bo'lsa,
    // kitobni keyingi odamga beramiz yoki bo'shatamiz.
    if (reservation.status === 'AWAITING_PICKUP') {
      const nextInQueue = await tx.reservation.findFirst({
        where: { bookId: reservation.bookId, status: 'ACTIVE' },
        orderBy: { reservedAt: 'asc' },
        include: { book: true },
      });

      if (nextInQueue) {
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + 48);
        await tx.reservation.update({
          where: { id: nextInQueue.id },
          data: { status: 'AWAITING_PICKUP', expiresAt: newExpiresAt },
        });

        const newNotification = await tx.notification.create({
          data: {
            userId: nextInQueue.userId,
            message: `Siz navbatda turgan "${nextInQueue.book.title}" kitobi bo'shadi! Uni 48 soat ichida olib keting.`,
            type: 'RESERVATION_AVAILABLE',
          },
        });
        getReservationIo()
          .to(nextInQueue.userId)
          .emit('new_notification', newNotification);
      } else {
        // Free the held copy back to pool
        await tx.book.update({
          where: { id: reservation.bookId },
          data: { availableCopies: { increment: 1 } },
        });
        await recomputeBookStatus(tx as any, reservation.bookId);
      }
    }
  });
};
