// src/api/loan/loan.service.ts

import prisma from '../../config/db.config.js';
import { ReservationStatus } from '@prisma/client';
import ApiError from '../../utils/ApiError.js';
import { NotificationType } from '@prisma/client';
import { getIo } from '../../utils/socket.js';

export const createLoan = async (bookId: string, userId: string) => {
  const BORROWING_LIMIT = 5;

  return prisma.$transaction(async (tx) => {
    const activeLoansCount = await tx.loan.count({
      where: { userId: userId, status: 'ACTIVE' },
    });

    if (activeLoansCount >= BORROWING_LIMIT) {
      throw new ApiError(
        400,
        `You can only borrow up to ${BORROWING_LIMIT} books at a time.`,
      );
    }

    const overdueLoan = await tx.loan.findFirst({
      where: { userId: userId, status: 'OVERDUE' },
    });

    if (overdueLoan) {
      throw new ApiError(
        400,
        'You have an overdue book. Please return it to borrow a new one.',
      );
    }

    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new ApiError(404, 'Book with this ID was not found.');
    }

    if (book.status === 'RESERVED') {
      // Agar kitob band qilingan bo'lsa, faqat kerakli odamga beramiz
      const reservation = await tx.reservation.findFirst({
        where: { bookId, status: 'AWAITING_PICKUP' },
      });

      if (!reservation || reservation.userId !== userId) {
        throw new ApiError(
          400,
          'This book is currently reserved for another user.',
        );
      }

      // Rezervatsiyani bajarilgan deb belgilaymiz
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'FULFILLED' },
      });
    } else if (book.status !== 'AVAILABLE') {
      // Boshqa har qanday holatda (BORROWED, PENDING_RETURN) ijaraga berib bo'lmaydi
      throw new ApiError(
        400,
        'This book is not available for loan at the moment.',
      );
    }

    await tx.book.update({
      where: { id: bookId },
      data: { status: 'BORROWED' },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    return tx.loan.create({
      data: { bookId, userId, dueDate, status: 'ACTIVE' },
      include: {
        book: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  });
};

export const findUserLoans = async (userId: string) => {
  return prisma.loan.findMany({
    where: { userId },
    include: { book: true },
    orderBy: { borrowedAt: 'desc' },
  });
};

export const findAllLoans = async () => {
  return prisma.loan.findMany({
    include: {
      book: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { borrowedAt: 'desc' },
  });
};

export const initiateReturn = async (loanId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { user: true, book: true },
    });
    if (!loan) throw new ApiError(404, 'Loan not found.');
    if (loan.userId !== userId)
      throw new ApiError(403, 'You can only return your own loans.');
    if (loan.status !== 'ACTIVE' && loan.status !== 'OVERDUE') {
      throw new ApiError(
        400,
        'This loan is already being returned or has been completed.',
      );
    }

    await tx.book.update({
      where: { id: loan.bookId },
      data: { status: 'PENDING_RETURN' },
    });
    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: { status: 'PENDING_RETURN' },
    });

    const librarians = await tx.user.findMany({ where: { role: 'LIBRARIAN' } });
    const notificationData = librarians.map((lib) => ({
      userId: lib.id,
      message: `Foydalanuvchi ${loan.user.firstName} "${loan.book.title}" kitobini qaytarish uchun belgiladi.`,
      type: NotificationType.INFO,
    }));
    await tx.notification.createMany({ data: notificationData });

    // Socket orqali kutubxonachilarga signal yuborish
    getIo()
      .to(librarians.map((l) => l.id))
      .emit('refetch_notifications');

    return updatedLoan;
  });
};

export const confirmReturn = async (loanId: string) => {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { book: true },
    });
    if (!loan) throw new ApiError(404, 'Loan not found.');
    if (loan.status !== 'PENDING_RETURN')
      throw new ApiError(400, 'This loan has not been marked for return.');

    const firstReservation = await tx.reservation.findFirst({
      where: { bookId: loan.bookId, status: 'ACTIVE' },
      orderBy: { reservedAt: 'asc' },
    });

    if (firstReservation) {
      await tx.book.update({
        where: { id: loan.bookId },
        data: { status: 'RESERVED' },
      });
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      await tx.reservation.update({
        where: { id: firstReservation.id },
        data: { status: 'AWAITING_PICKUP', expiresAt: expiresAt },
      });
      const newNotification = await tx.notification.create({
        data: {
          userId: firstReservation.userId,
          message: `Siz navbatda turgan "${loan.book.title}" kitobi bo'shadi! Uni 24 soat ichida olib keting.`,
          type: 'RESERVATION_AVAILABLE',
        },
      });
      // Socket orqali navbatdagi foydalanuvchiga xabar yuborish
      getIo()
        .to(firstReservation.userId)
        .emit('new_notification', newNotification);
    } else {
      await tx.book.update({
        where: { id: loan.bookId },
        data: { status: 'AVAILABLE' },
      });
    }

    return tx.loan.update({
      where: { id: loanId },
      data: { status: 'RETURNED', returnedAt: new Date() },
    });
  });
};

export const requestRenewal = async (loanId: string, userId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { user: true, book: true },
  });
  if (!loan) throw new ApiError(404, 'Loan not found.');
  if (loan.userId !== userId)
    throw new ApiError(403, 'You can only request renewal for your own loans.');
  if (loan.status !== 'ACTIVE')
    throw new ApiError(400, 'Only active loans can be renewed.');
  if (loan.renewalRequested)
    throw new ApiError(
      400,
      'You have already requested a renewal for this loan.',
    );

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: { renewalRequested: true },
  });

  const librarians = await prisma.user.findMany({
    where: { role: 'LIBRARIAN' },
  });
  const notificationData = librarians.map((lib) => ({
    userId: lib.id,
    message: `Foydalanuvchi ${loan.user.firstName} "${loan.book.title}" kitobi uchun muddat uzaytirishni so'radi.`,
    type: NotificationType.INFO,
  }));
  await prisma.notification.createMany({ data: notificationData });

  // Socket orqali kutubxonachilarga signal yuborish
  getIo()
    .to(librarians.map((l) => l.id))
    .emit('refetch_notifications');

  return updatedLoan;
};

export const approveRenewal = async (loanId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { book: true },
  });
  if (!loan) throw new ApiError(404, 'Loan not found.');
  if (!loan.renewalRequested)
    throw new ApiError(400, 'A renewal has not been requested for this loan.');

  const newDueDate = new Date(loan.dueDate);
  newDueDate.setDate(newDueDate.getDate() + 14);

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: { dueDate: newDueDate, renewalRequested: false },
  });

  const newNotification = await prisma.notification.create({
    data: {
      userId: loan.userId,
      message: `Sizning "${loan.book.title}" kitobi uchun muddat uzaytirish so'rovingiz tasdiqlandi.`,
      type: 'INFO',
    },
  });
  // Socket orqali foydalanuvchiga xabar yuborish
  getIo().to(loan.userId).emit('new_notification', newNotification);

  return updatedLoan;
};

export const rejectRenewal = async (loanId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { book: true },
  });
  if (!loan) throw new ApiError(404, 'Loan not found.');
  if (!loan.renewalRequested)
    throw new ApiError(400, 'A renewal has not been requested for this loan.');

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: { renewalRequested: false },
  });

  const newNotification = await prisma.notification.create({
    data: {
      userId: loan.userId,
      message: `Afsuski, sizning "${loan.book.title}" kitobi uchun muddat uzaytirish so'rovingiz rad etildi.`,
      type: 'WARNING',
    },
  });
  // Socket orqali foydalanuvchiga xabar yuborish
  getIo().to(loan.userId).emit('new_notification', newNotification);

  return updatedLoan;
};
