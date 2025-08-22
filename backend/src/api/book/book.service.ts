// src/api/book/book.service.ts

import { Prisma, BookStatus, NotificationType } from '@prisma/client';
import prisma from '../../config/db.config.js';
import redisClient from '../../config/redis.config.js';
import ApiError from '../../utils/ApiError.js';
import { ReservationStatus } from '@prisma/client';
import { getIo } from '../../utils/socket.js';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

export const createBook = async (input: Prisma.BookCreateInput) => {
  if (!input.coverImage) {
    input.coverImage = '/public/uploads/books/default.png';
  }

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
      'You can only delete books that are currently available.',
    );
  }

  // Rasm yo'lini tranzaksiyadan oldin saqlab olamiz
  const imagePath = book.coverImage;

  await prisma.$transaction(async (tx) => {
    const loans = await tx.loan.findMany({ where: { bookId: id } });
    const loanIds = loans.map((l) => l.id);
    if (loanIds.length > 0) {
      await tx.fine.deleteMany({ where: { loanId: { in: loanIds } } });
    }
    await tx.loan.deleteMany({ where: { bookId: id } });
    await tx.bookComment.deleteMany({ where: { bookId: id } });
    await tx.reservation.deleteMany({ where: { bookId: id } });
    await tx.book.delete({ where: { id } });
  });

  // Tranzaksiya muvaffaqiyatli yakunlangandan so'ng, rasm faylini o'chiramiz
  if (imagePath && imagePath !== '/public/uploads/books/default.png') {
    try {
      // Bazadagi yo'l '/public/...' bilan boshlanadi, fayl tizimi uchun boshidagi '/' kerak emas
      const fullPath = path.join(process.cwd(), imagePath.substring(1));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Successfully deleted image: ${fullPath}`);
      }
    } catch (err) {
      console.error(`Failed to delete image ${imagePath}:`, err);
    }
  }

  const BOOK_CACHE_KEY = `book:${id}`;
  await redisClient.del(BOOK_CACHE_KEY);
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

export const bulkCreateBooks = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const booksJson = xlsx.utils.sheet_to_json(worksheet) as any[];

  if (!booksJson || booksJson.length === 0) {
    throw new ApiError(400, 'Excel fayli bo`sh yoki noto`g`ri formatda.');
  }

  const allCategories = await prisma.category.findMany();
  const categoryMap = new Map(
    allCategories.map((cat) => [cat.name.toLowerCase(), cat.id]),
  );

  const booksToCreate: Prisma.BookCreateManyInput[] = [];

  for (const book of booksJson) {
    if (!book.title || !book.author || !book.category) {
      throw new ApiError(
        400,
        `Excel faylida barcha kerakli ustunlar (title, author, category) bo'lishi shart.`,
      );
    }

    const categoryId = categoryMap.get(String(book.category).toLowerCase());
    if (!categoryId) {
      throw new ApiError(400, `"${book.category}" nomli kategoriya topilmadi.`);
    }

    booksToCreate.push({
      title: String(book.title),
      author: String(book.author),
      categoryId: categoryId,
      isbn: book.isbn ? String(book.isbn) : null,
      description: book.description ? String(book.description) : null,
      publisher: book.publisher ? String(book.publisher) : null,
      publishedYear: book.publishedYear ? Number(book.publishedYear) : null,
      pageCount: book.pageCount ? Number(book.pageCount) : null,
      coverImage: '/public/uploads/books/default.png',
    });
  }

  const result = await prisma.book.createMany({
    data: booksToCreate,
    skipDuplicates: true,
  });

  // --- YANGI QO'SHILGAN BILDirishNOMA MANTIG'I ---
  if (result.count > 0) {
    const usersToNotify = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });

    if (usersToNotify.length > 0) {
      const notificationData = usersToNotify.map((user) => ({
        userId: user.id,
        message: `Kutubxonaga ${result.count} ta yangi kitob qo'shildi! Katalog bilan tanishing.`,
        type: NotificationType.INFO,
      }));

      await prisma.notification.createMany({ data: notificationData });

      const io = getIo();
      // Barcha foydalanuvchilarga bildirishnomalarni yangilash uchun signal yuboramiz
      io.to(usersToNotify.map((u) => u.id)).emit('refetch_notifications');
    }
  }
  // --- MANTIQ TUGADI ---

  return result;
};
