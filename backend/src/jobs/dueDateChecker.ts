import cron from 'node-cron';
import prisma from '../config/db.config.js';
import { LoanStatus, NotificationType } from '@prisma/client';
import { getIo } from '../utils/socket.js'; // Socket yordamchisini import qilamiz

const FINE_AMOUNT = 5000;

export const startDueDateChecker = () => {
  console.log('🗓️ Due date checker cron job enabled.');

  // Har kuni tungi soat 1 da ishga tushadi
  cron.schedule('0 1 * * *', async () => {
    console.log('⏳ Checking for overdue and upcoming due loans...');
    const io = getIo();

    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);

    const tomorrow_start = new Date();
    tomorrow_start.setDate(tomorrow_start.getDate() + 1);
    tomorrow_start.setHours(0, 0, 0, 0);

    const tomorrow_end = new Date();
    tomorrow_end.setDate(tomorrow_end.getDate() + 1);
    tomorrow_end.setHours(23, 59, 59, 999);

    // Ertaga muddati tugaydigan ijaralar
    const loansDueTomorrow = await prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: {
          gte: tomorrow_start,
          lt: tomorrow_end,
        },
      },
      include: { book: true },
    });

    // Muddati o'tib ketgan ijaralar
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: { lt: today_start },
      },
      include: { book: true },
    });

    // 1. Ertaga muddati tugaydiganlar uchun bildirishnoma yuborish
    for (const loan of loansDueTomorrow) {
      const newNotification = await prisma.notification.create({
        data: {
          userId: loan.userId,
          message: `Sizning "${loan.book.title}" kitobini qaytarish muddatingiz ertaga tugaydi.`,
          type: NotificationType.WARNING,
        },
      });
      // Socket orqali real-time yuborish
      io.to(loan.userId).emit('new_notification', newNotification);
    }

    // 2. Muddati o'tganlar uchun jarima solish va bildirishnoma yuborish
    for (const loan of overdueLoans) {
      await prisma.$transaction(async (tx) => {
        await tx.loan.update({
          where: { id: loan.id },
          data: { status: LoanStatus.OVERDUE },
        });

        const newNotification = await tx.notification.create({
          data: {
            userId: loan.userId,
            message: `Sizning "${loan.book.title}" kitobini qaytarish muddatingiz o'tib ketdi! Jarima qo'llanilishi mumkin.`,
            type: NotificationType.FINE,
          },
        });
        // Socket orqali real-time yuborish
        io.to(loan.userId).emit('new_notification', newNotification);

        const existingFine = await tx.fine.findFirst({
          where: { loanId: loan.id },
        });

        if (!existingFine) {
          await tx.fine.create({
            data: {
              amount: FINE_AMOUNT,
              reason: `"${loan.book.title}" kitobini o'z vaqtida qaytarmaganlik uchun.`,
              loanId: loan.id,
              userId: loan.userId,
            },
          });
          console.log(`Fine created for loan (${loan.id}).`);
        }
      });
    }

    console.log('✅ Due date check complete.');
  });
};
