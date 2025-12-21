// COMMENTED OUT - Reservation feature disabled
/*
import cron from 'node-cron';
import prisma from '../config/db.config.js';
import {
  RESERVATION_PICKUP_HOURS,
  RESERVATION_STATUS,
  BOOK_STATUS,
} from '../config/constants.js'; // <-- KONSTANTALAR IMPORT QILINDI
import { getIo } from '../utils/socket.js';

export const startReservationChecker = () => {
  console.log(
    '🗓️  Rezervatsiya muddatini tekshiruvchi avtomatik vazifa yoqildi.',
  );

  cron.schedule('0 * * * *', async () => {
    console.log(
      '⏳ Tekshiruv boshlandi: Muddati o`tgan rezervatsiyalar qidirilmoqda...',
    );
    const io = getIo();
    const now = new Date();

    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: RESERVATION_STATUS.AWAITING_PICKUP,
        expiresAt: { lt: now },
      },
      include: { book: true },
    });

    for (const reservation of expiredReservations) {
      await prisma.$transaction(async (tx) => {
        // 1. Rezervatsiyani "muddati o'tgan" deb belgilaymiz
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: RESERVATION_STATUS.EXPIRED },
        });

        // 2. Foydalanuvchiga bildirishnoma yuboramiz
        const userNotification = await tx.notification.create({
          data: {
            userId: reservation.userId,
            message: `Siz band qilgan "${reservation.book.title}" kitobini olib ketish muddati tugadi. Rezervatsiya bekor qilindi.`,
            type: 'WARNING',
          },
        });
        io.to(reservation.userId).emit('new_notification', userNotification);

        // 3. Navbatda turgan keyingi odamni qidiramiz
        const nextInQueue = await tx.reservation.findFirst({
          where: {
            bookId: reservation.bookId,
            status: RESERVATION_STATUS.ACTIVE,
          },
          orderBy: { reservedAt: 'asc' },
          include: { book: true },
        });

        if (nextInQueue) {
          // Agar navbatda odam bo'lsa:
          const newExpiresAt = new Date();
          newExpiresAt.setHours(
            newExpiresAt.getHours() + RESERVATION_PICKUP_HOURS, // <-- KONSTANTA ISHLATILDI
          );

          // --- 1-TUZATISH: Bo'shagan nusxani navbatdagi odamga tayinlaymiz ---
          await tx.reservation.update({
            where: { id: nextInQueue.id },
            data: {
              status: RESERVATION_STATUS.AWAITING_PICKUP,
              expiresAt: newExpiresAt,
              assignedCopyId: reservation.assignedCopyId, // <-- ENG MUHIM QISM!
            },
          });
          // Nusxaning holati 'MAINTENANCE'da qoladi, chunki u endi keyingi odamni kutyapti.

          const nextUserNotification = await tx.notification.create({
            data: {
              userId: nextInQueue.userId,
              message: `Siz navbatda turgan "${nextInQueue.book.title}" kitobi bo'shadi! Uni ${RESERVATION_PICKUP_HOURS} soat ichida olib keting.`,
              type: 'RESERVATION_AVAILABLE',
            },
          });
          io.to(nextInQueue.userId).emit(
            'new_notification',
            nextUserNotification,
          );
        } else {
          // Agar navbatda hech kim bo'lmasa:
          // --- 2-TUZATISH: `Book`ni emas, `BookCopy`ning statusini yangilaymiz ---
          if (reservation.assignedCopyId) {
            await tx.bookCopy.update({
              where: { id: reservation.assignedCopyId },
              data: { status: BOOK_STATUS.AVAILABLE },
            });
          }
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
*/
