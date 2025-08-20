// src/api/book/book.service.ts

import { Prisma, BookStatus, NotificationType } from '@prisma/client';
import prisma from '../../config/db.config.js';
import redisClient from '../../config/redis.config.js';
import ApiError from '../../utils/ApiError.js';
import { ReservationStatus } from '@prisma/client';
import { getIo } from '../../utils/socket.js';

export const createBook = async (input: Prisma.BookCreateInput) => {
  const newBook = await prisma.book.create({
    data: input,
    include: { category: true },
  });

  const usersToNotify = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true },
  });

  if (usersToNotify.length > 0) {
    const notificationData = usersToNotify.map((user) => ({
      userId: user.id,
      message: `Kutubxonaga yangi kitob qo'shildi: "${newBook.title}"!`,
      type: NotificationType.INFO,
    }));
    await prisma.notification.createMany({
      data: notificationData,
    });

    // Socket orqali barcha foydalanuvchilarga xabar yuborish
    const io = getIo();
    usersToNotify.forEach((user) => {
      // Har bir foydalanuvchiga o'zining "xona"si orqali
      // bildirishnomalarni yangilash kerakligi haqida signal yuboramiz
      io.to(user.id).emit('refetch_notifications');
    });
  }

  return newBook;
};

export const findBooks = async (
  query: { search?: string; status?: BookStatus; categoryId?: string },
  pagination: { page: number; limit: number },
) => {
  const { search, status, categoryId } = query;
  const { page, limit } = pagination;

  const skip = (page - 1) * limit;

  const where: Prisma.BookWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;

  const [books, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.book.count({ where }),
  ]);

  return { data: books, total };
};

export const findBookById = async (id: string) => {
  const BOOK_CACHE_KEY = `book:${id}`;

  const cachedBook = await redisClient.get(BOOK_CACHE_KEY);
  if (cachedBook) {
    console.log(`Book (${id}) retrieved from CACHE.`);
    return JSON.parse(cachedBook);
  }

  console.log(`Book (${id}) retrieved from DATABASE.`);
  const book = await prisma.book.findUnique({
    where: { id },
    include: { category: true },
  });

  if (book) {
    await redisClient.set(BOOK_CACHE_KEY, JSON.stringify(book), {
      EX: 3600,
    });
  }

  return book;
};

export const updateBook = async (id: string, data: Prisma.BookUpdateInput) => {
  const updatedBook = await prisma.book.update({
    where: { id },
    data,
    include: { category: true },
  });

  const BOOK_CACHE_KEY = `book:${id}`;
  await redisClient.del(BOOK_CACHE_KEY);
  console.log(`Book cache invalidated for ID: ${id}`);

  return updatedBook;
};

export const deleteBook = async (id: string) => {
  const book = await prisma.book.findUnique({ where: { id } });

  if (!book) {
    throw new ApiError(404, 'Book not found.');
  }

  if (book.status !== 'AVAILABLE') {
    throw new ApiError(
      400,
      'You can only delete books that are currently available. This book is either on loan or reserved.',
    );
  }

  // Bitta tranzaksiya ichida kitobga bog'liq barcha narsani tozalaymiz
  await prisma.$transaction(async (tx) => {
    // Kitobga bog'liq ijaralarni topamiz
    const loans = await tx.loan.findMany({ where: { bookId: id } });
    const loanIds = loans.map((l) => l.id);

    // O'sha ijaralarga bog'liq jarimalarni o'chiramiz
    if (loanIds.length > 0) {
      await tx.fine.deleteMany({ where: { loanId: { in: loanIds } } });
    }

    // Endi ijaralarning o'zini o'chiramiz
    await tx.loan.deleteMany({ where: { bookId: id } });

    // Boshqa bog'liqliklarni o'chiramiz
    await tx.bookComment.deleteMany({ where: { bookId: id } });
    await tx.reservation.deleteMany({ where: { bookId: id } });

    // Va nihoyat, kitobning o'zini o'chiramiz
    await tx.book.delete({ where: { id } });
  });

  const BOOK_CACHE_KEY = `book:${id}`;
  await redisClient.del(BOOK_CACHE_KEY);
  console.log(`Book cache invalidated for ID: ${id}`);
};

export const createComment = async (input: {
  bookId: string;
  userId: string;
  comment: string;
  rating?: number;
}) => {
  const { bookId, userId, comment, rating } = input;
  return prisma.bookComment.create({
    data: {
      comment,
      rating,
      book: { connect: { id: bookId } },
      user: { connect: { id: userId } },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const findCommentsByBookId = async (bookId: string) => {
  return prisma.bookComment.findMany({
    where: { bookId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const reserveBook = async (bookId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new ApiError(404, 'Kitob topilmadi.');
    }

    // 1. Foydalanuvchining aktiv rezervatsiyasi borligini tekshiramiz
    const activeReservation = await tx.reservation.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'AWAITING_PICKUP'] },
      },
    });
    if (activeReservation) {
      if (activeReservation.bookId === bookId) {
        throw new ApiError(
          409,
          'Siz bu kitobni allaqachon band qilib bo`lgansiz.',
        );
      } else {
        throw new ApiError(
          400,
          'Siz bir vaqtning o`zida faqat bitta kitobni band qila olasiz.',
        );
      }
    }

    // 2. Kitobning statusini tekshiramiz
    if (book.status !== 'AVAILABLE' && book.status !== 'BORROWED') {
      throw new ApiError(400, 'Bu kitobni hozirda band qilib bo`lmaydi.');
    }

    // 3. Eski, tugagan rezervatsiyani qidiramiz
    const existingInactiveReservation = await tx.reservation.findFirst({
      where: {
        userId,
        bookId,
        status: { in: ['FULFILLED', 'EXPIRED', 'CANCELLED'] },
      },
    });

    let reservation;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    if (book.status === 'AVAILABLE') {
      await tx.book.update({
        where: { id: bookId },
        data: { status: 'RESERVED' },
      });

      if (existingInactiveReservation) {
        // Agar eski yozuv bo'lsa, uni YANGILAYMIZ
        reservation = await tx.reservation.update({
          where: { id: existingInactiveReservation.id },
          data: {
            status: 'AWAITING_PICKUP',
            expiresAt,
            reservedAt: new Date(),
          },
        });
      } else {
        // Agar eski yozuv bo'lmasa, YANGI YARATAMIZ
        reservation = await tx.reservation.create({
          data: { bookId, userId, status: 'AWAITING_PICKUP', expiresAt },
        });
      }

      // Bildirishnomalarni yuborish
      const userNotification = await tx.notification.create({
        data: {
          userId,
          message: `Siz "${book.title}" kitobini muvaffaqiyatli band qildingiz! Uni 48 soat ichida kutubxonadan olib keting.`,
          type: NotificationType.RESERVATION_AVAILABLE,
        },
      });
      getIo().to(userId).emit('new_notification', userNotification);

      const librarians = await tx.user.findMany({
        where: { role: 'LIBRARIAN' },
        select: { id: true },
      });
      const userWhoReserved = await tx.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (librarians.length > 0) {
        const librarianNotificationsData = librarians.map((lib) => ({
          userId: lib.id,
          message: `Foydalanuvchi ${userWhoReserved?.firstName} ${userWhoReserved?.lastName} "${book.title}" kitobini band qildi va olib ketishni kutyapti.`,
          type: NotificationType.INFO,
        }));
        await tx.notification.createMany({ data: librarianNotificationsData });
        getIo()
          .to(librarians.map((l) => l.id))
          .emit('refetch_notifications');
      }
    } else {
      // book.status === 'BORROWED'
      if (existingInactiveReservation) {
        reservation = await tx.reservation.update({
          where: { id: existingInactiveReservation.id },
          data: { status: 'ACTIVE', expiresAt: null, reservedAt: new Date() },
        });
      } else {
        reservation = await tx.reservation.create({
          data: { bookId, userId, status: 'ACTIVE' },
        });
      }
    }

    return reservation;
  });
};
