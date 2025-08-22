import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { NotificationType, Prisma } from '@prisma/client';
import { getIo } from '../../utils/socket.js';

export const findAllFines = async (query: { isPaid?: string }) => {
  const where: any = {};
  if (query.isPaid) {
    where.isPaid = query.isPaid === 'true';
  }
  return prisma.fine.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      loan: { include: { book: { select: { id: true, title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const findUserFines = async (userId: string) => {
  return prisma.fine.findMany({
    where: { userId },
    include: {
      loan: { include: { book: { select: { id: true, title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const markFineAsPaid = async (fineId: string) => {
  const fine = await prisma.fine.findUnique({ where: { id: fineId } });
  if (!fine) {
    throw new ApiError(404, 'Fine not found.');
  }
  if (fine.isPaid) {
    throw new ApiError(400, 'This fine has already been paid.');
  }
  return prisma.fine.update({
    where: { id: fineId },
    data: {
      isPaid: true,
      paidAt: new Date(),
    },
  });
};

export const createManualFine = async (input: {
  userId: string;
  bookId: string;
  amount: number;
  reason: string;
}) => {
  const { userId, bookId, amount, reason } = input;

  return prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new ApiError(404, 'Kitob topilmadi.');
    }

    const loan = await tx.loan.findFirst({
      where: { userId, bookId, status: { in: ['ACTIVE', 'OVERDUE'] } },
    });

    if (loan) {
      await tx.loan.update({
        where: { id: loan.id },
        data: { status: 'RETURNED', returnedAt: new Date() },
      });
    }

    await tx.book.update({
      where: { id: bookId },
      data: { status: 'MAINTENANCE' },
    });

    // Ma'lumotlar obyektini tayyorlaymiz
    const dataToCreate: Prisma.FineUncheckedCreateInput = {
      userId,
      amount,
      reason,
    };

    // Agar ijara yozuvi topilgan bo'lsa, uning ID'sini qo'shamiz
    if (loan) {
      dataToCreate.loanId = loan.id;
    }

    // Tayyorlangan ma'lumotlar bilan yangi jarima yaratamiz
    const newFine = await tx.fine.create({
      data: dataToCreate,
    });

    const userNotification = await tx.notification.create({
      data: {
        userId: userId,
        message: `Sizga "${book.title}" kitobi uchun ${amount} so'm miqdorida jarima yozildi. Sababi: ${reason}`,
        type: NotificationType.FINE,
      },
    });

    getIo().to(userId).emit('new_notification', userNotification);

    return newFine;
  });
};
