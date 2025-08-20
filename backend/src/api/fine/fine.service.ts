import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';

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
