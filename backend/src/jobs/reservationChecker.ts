import cron from 'node-cron';
import prisma from '../config/db.config.js';
import { NotificationType } from '@prisma/client';
import { getIo } from '../utils/socket.js'; // Socket yordamchisini import qilamiz

export const startReservationChecker = () => {
  console.log(
    '🗓️  Rezervatsiya muddatini tekshiruvchi avtomatik vazifa yoqildi.',
  );

  // Har soatda bir marta ishga tushadi
  cron.schedule('0 * * * *', async () => {
    console.log(
      '⏳ Tekshiruv boshlandi: Muddati o`tgan rezervatsiyalar qidirilmoqda...',
    );
    const io = getIo();
    const now = new Date();

    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'AWAITING_PICKUP',
        expiresAt: { lt: now },
      },
      include: { book: true },
    });

    for (const reservation of expiredReservations) {
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'EXPIRED' },
        });

        const userNotification = await tx.notification.create({
          data: {
            userId: reservation.userId,
            message: `Siz band qilgan "${reservation.book.title}" kitobini olib ketish muddati tugadi. Rezervatsiya bekor qilindi.`,
            type: 'WARNING',
          },
        });
        // Socket orqali foydalanuvchiga xabar yuborish
        io.to(reservation.userId).emit('new_notification', userNotification);

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

          // Navbatdagi foydalanuvchiga bildirishnoma yuborish
          const nextUserNotification = await tx.notification.create({
            data: {
              userId: nextInQueue.userId,
              message: `Siz navbatda turgan "${nextInQueue.book.title}" kitobi bo'shadi! Uni 48 soat ichida olib keting.`,
              type: 'RESERVATION_AVAILABLE',
            },
          });
          // Socket orqali navbatdagi foydalanuvchiga xabar yuborish
          io.to(nextInQueue.userId).emit(
            'new_notification',
            nextUserNotification,
          );
        } else {
          await tx.book.update({
            where: { id: reservation.bookId },
            data: { status: 'AVAILABLE' },
          });
        }
      });
    }
    if (expiredReservations.length > 0) {
      console.log(
        `✅ ${expiredReservations.length} ta muddati o'tgan rezervatsiya bekor qilindi.`,
      );
    }
  });
};
