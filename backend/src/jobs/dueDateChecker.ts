import cron from 'node-cron';
import prisma from '../config/db.config.js';
import { LoanStatus, NotificationType } from '@prisma/client';
import { getIo } from '../utils/socket.js';

export const startDueDateChecker = () => {
  console.log('🗓️ Due date checker cron job enabled.');

  cron.schedule('0 1 * * *', async () => {
    console.log('⏳ Checking for overdue and upcoming due loans...');
    const io = getIo();

    // Fetch library settings
    const settings = await prisma.librarySettings.findFirst();
    const enableFines = settings?.enableFines ?? true;
    const fineAmount = settings?.fineAmountPerDay ?? 5000;

    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);

    // --- 1-TUZATISH: include qismi kitob nomini olish uchun to'g'rilandi ---
    const commonInclude = {
      bookCopy: {
        include: {
          book: {
            select: { title: true }, // Faqat sarlavha kerak
          },
        },
      },
    };

    // Ertaga muddati tugaydigan ijaralar
    const loansDueTomorrow = await prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: {
          gte: new Date(today_start.getTime() + 24 * 60 * 60 * 1000), // Ertangi kun boshlanishi
          lt: new Date(today_start.getTime() + 48 * 60 * 60 * 1000), // Ertangi kun tugashi
        },
      },
      include: commonInclude,
    });

    // Muddati o'tib ketgan ijaralar
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: { lt: today_start },
      },
      include: commonInclude,
    });

    // 1. Ertaga muddati tugaydiganlar uchun bildirishnoma yuborish
    for (const loan of loansDueTomorrow) {
      const message = `Sizning "${loan.bookCopy.book.title}" kitobini qaytarish muddatingiz ertaga tugaydi.`;
      const newNotification = await prisma.notification.create({
        data: {
          userId: loan.userId,
          message: message,
          type: NotificationType.WARNING,
        },
      });
      io.to(loan.userId).emit('new_notification', newNotification);
    }

    // 2. Muddati o'tganlar uchun jarima solish va bildirishnoma yuborish
    for (const loan of overdueLoans) {
      await prisma.$transaction(async (tx) => {
        await tx.loan.update({
          where: { id: loan.id },
          data: { status: LoanStatus.OVERDUE },
        });

        // --- 2-TUZATISH: Kitob nomiga murojaat to'g'rilandi (loan.book.title -> loan.bookCopy.book.title) ---
        const overdueMessage = `Sizning "${loan.bookCopy.book.title}" kitobini qaytarish muddatingiz o'tib ketdi! Jarima qo'llanilishi mumkin.`;
        const newNotification = await tx.notification.create({
          data: {
            userId: loan.userId,
            message: overdueMessage,
            type: NotificationType.FINE,
          },
        });
        io.to(loan.userId).emit('new_notification', newNotification);

        const existingFine = await tx.fine.findFirst({
          where: { loanId: loan.id },
        });

        if (!existingFine && enableFines) {
          // --- 3-TUZATISH: Kitob nomiga murojaat to'g'rilandi ---
          const reasonMessage = `"${loan.bookCopy.book.title}" kitobini o'z vaqtida qaytarmaganlik uchun.`;
          await tx.fine.create({
            data: {
              amount: fineAmount,
              reason: reasonMessage,
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
