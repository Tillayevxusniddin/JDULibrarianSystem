import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { NotificationType, Prisma } from '@prisma/client';
import { getIo } from '../../utils/socket.js';

/**
 * Barcha jarimalar ro'yxatini oladi
 */
export const findAllFines = async (query: { isPaid?: string }) => {
  const where: Prisma.FineWhereInput = {};
  if (query.isPaid) {
    where.isPaid = query.isPaid === 'true';
  }
  return prisma.fine.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      loan: {
        include: {
          bookCopy: {
            include: {
              book: {
                select: { id: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Foydalanuvchining shaxsiy jarimalarini oladi
 */
export const findUserFines = async (userId: string) => {
  return prisma.fine.findMany({
    where: { userId },
    include: {
      loan: {
        include: {
          bookCopy: {
            include: {
              book: {
                select: { id: true, title: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Jarimani to'langan deb belgilaydi
 */
export const markFineAsPaid = async (fineId: string) => {
  const fine = await prisma.fine.findUnique({ where: { id: fineId } });
  if (!fine) {
    throw new ApiError(404, 'Jarima topilmadi.');
  }
  if (fine.isPaid) {
    throw new ApiError(400, "Bu jarima allaqachon to'langan.");
  }
  return prisma.fine.update({
    where: { id: fineId },
    data: {
      isPaid: true,
      paidAt: new Date(),
    },
  });
};

/**
 * Kutubxonachi qo'lda jarima yaratadi (masalan, kitobga zarar yetkazilgani uchun).
 */
export const createManualFine = async (input: {
  userId: string;
  barcode: string;
  amount: number;
  reason: string;
}) => {
  const { userId, barcode, amount, reason } = input;

  return prisma.$transaction(async (tx) => {
    const bookCopy = await tx.bookCopy.findUnique({
      where: { barcode },
      include: { book: true },
    });
    if (!bookCopy) {
      throw new ApiError(404, 'Bunday shtrix-kodli kitob nusxasi topilmadi.');
    }

    const loan = await tx.loan.findFirst({
      where: { bookCopyId: bookCopy.id, status: { in: ['ACTIVE', 'OVERDUE'] } },
    });

    await tx.bookCopy.update({
      where: { id: bookCopy.id },
      data: { status: 'MAINTENANCE' },
    });

    const dataToCreate: Prisma.FineUncheckedCreateInput = {
      userId,
      amount,
      reason,
    };
    if (loan) {
      dataToCreate.loanId = loan.id;
      await tx.loan.update({
        where: { id: loan.id },
        data: { status: 'RETURNED', returnedAt: new Date() },
      });
    }

    const newFine = await tx.fine.create({ data: dataToCreate });

    const userNotification = await tx.notification.create({
      data: {
        userId: userId,
        message: `Sizga "${bookCopy.book.title}" kitobi uchun ${amount} so'm miqdorida jarima yozildi. Sababi: ${reason}`,
        type: NotificationType.FINE,
      },
    });

    getIo().to(userId).emit('new_notification', userNotification);

    return newFine;
  });
};
