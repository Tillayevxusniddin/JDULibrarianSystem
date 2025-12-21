import { Prisma, BookCopyStatus, NotificationType } from '@prisma/client';
import prisma from '../../config/db.config.js';
import redisClient from '../../config/redis.config.js';
import ApiError from '../../utils/ApiError.js';
import { getIo } from '../../utils/socket.js';
import { DEFAULT_BOOK_COVER } from '../../config/constants.js';
import { deleteFromS3 } from '../../utils/s3.service.js';

import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

// #####################################################################
// ### ASOSIY KITOBLAR BILAN ISHLASH (CRUD) ###
// #####################################################################

/**
 * Yangi kitob "pasporti"ni va unga tegishli jismoniy nusxalarni yaratadi.
 * @param bookData - Kitobning asosiy ma'lumotlari (sarlavha, muallif, isbn...)
 * @param copiesData - Kitob nusxalarining ro'yxati (har birining o'z shtrix-kodi bilan)
 */
export const createBook = async (
  bookData: any,
  copiesData: { barcode: string }[],
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Kitobning o'zini (pasportini) yaratamiz
    const newBook = await tx.book.create({
      data: {
        ...bookData,
        coverImage: bookData.coverImage || null,
      },
      include: { category: true },
    });

    // 2. Unga tegishli barcha jismoniy nusxalarni yaratamiz
    await tx.bookCopy.createMany({
      data: copiesData.map((copy) => ({
        bookId: newBook.id,
        barcode: copy.barcode,
      })),
    });

    // 3. Foydalanuvchilarga yangi kitob haqida xabar beramiz
    const usersToNotify = await tx.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });
    if (usersToNotify.length > 0) {
      const notificationData = usersToNotify.map((user) => ({
        userId: user.id,
        message: `Kutubxonaga yangi kitob qo'shildi: "${newBook.title}"!`,
        type: NotificationType.INFO,
      }));
      await tx.notification.createMany({ data: notificationData });
      const io = getIo();
      io.to(usersToNotify.map((u) => u.id)).emit('refetch_notifications');
    }

    // Frontga tushunarli bo'lishi uchun nusxalar sonini ham qaytaramiz
    return {
      ...newBook,
      totalCopies: copiesData.length,
      availableCopies: copiesData.length,
    };
  });
};

/**
 * Barcha kitoblar ro'yxatini oladi. Nusxalar sonini virtual hisoblaydi.
 */
export const findBooks = async (
  query: {
    search?: string;
    categoryId?: string;
    availability?: 'available' | 'borrowed';
  },
  pagination: { page: number; limit: number },
) => {
  const { search, categoryId, availability } = query;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.BookWhereInput = {};
  if (search)
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
      { copies: { some: { barcode: { contains: search, mode: 'insensitive' } } } },
      { copies: { some: { id: { contains: search, mode: 'insensitive' } } } },
    ];
  if (categoryId) where.categoryId = categoryId;
  if (availability === 'available')
    where.copies = { some: { status: 'AVAILABLE' } };
  if (availability === 'borrowed')
    where.copies = { none: { status: 'AVAILABLE' } };

  const books = await prisma.book.findMany({
    where,
    skip,
    take: limit,
    include: {
      category: true,
      copies: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.book.count({ where });

  const data = books.map((book) => {
    const totalCopies = book.copies.length;
    const availableCopies = book.copies.filter(
      (c) => c.status === 'AVAILABLE',
    ).length;
    const { copies, ...rest } = book; // `copies` massivini frontga yubormaymiz
    return { ...rest, totalCopies, availableCopies };
  });

  return { data, total };
};

/**
 * Bitta kitobni IDsi bo'yicha to'liq ma'lumotlari (va barcha nusxalari) bilan oladi.
 */
export const findBookById = async (id: string) => {
  const BOOK_CACHE_KEY = `book:${id}`;
  const cachedBook = await redisClient.get(BOOK_CACHE_KEY);
  if (cachedBook) return JSON.parse(cachedBook);

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      category: true,
      copies: { orderBy: { barcode: 'asc' } },
    },
  });

  if (!book) return null;

  const totalCopies = book.copies.length;
  const availableCopies = book.copies.filter(
    (c) => c.status === 'AVAILABLE',
  ).length;

  const result = { ...book, totalCopies, availableCopies };
  await redisClient.set(BOOK_CACHE_KEY, JSON.stringify(result), { EX: 3600 });

  return result;
};

/**
 * Faqat kitob "pasporti" ma'lumotlarini (sarlavha, muallif va hokazo) yangilaydi.
 */
export const updateBook = async (id: string, data: any) => {
  // 1. O'zgartirishdan oldin eski rasm manzilini bazadan olib qo'yamiz
  const existingBook = await prisma.book.findUnique({
    where: { id },
    select: { coverImage: true },
  });

  if (!existingBook) {
    throw new ApiError(404, 'Kitob topilmadi');
  }

  // Frontend'dan FormData orqali kelgan string qiymatlarni raqamga o'tkazamiz
  if (data.publishedYear) {
    data.publishedYear = parseInt(data.publishedYear, 10);
  }
  if (data.pageCount) {
    data.pageCount = parseInt(data.pageCount, 10);
  }

  // 2. Ma'lumotlarni bazada yangilaymiz
  const updatedBook = await prisma.book.update({
    where: { id },
    data,
    include: { category: true },
  });

  // 3. Redis keshini tozalaymiz
  await redisClient.del(`book:${id}`);

  // 4. Agar yangi rasm yuklangan bo'lsa (data.coverImage mavjud)
  // va eski rasm mavjud bo'lib, u standart rasm bo'lmasa, eskisini S3'dan o'chiramiz
  if (
    data.coverImage &&
    existingBook.coverImage &&
    existingBook.coverImage !== DEFAULT_BOOK_COVER
  ) {
    await deleteFromS3(existingBook.coverImage);
  }

  return updatedBook;
};

/**
 * Kitobni va unga tegishli barcha nusxalarni o'chiradi.
 */
export const deleteBook = async (id: string) => {
  const loanedCopiesCount = await prisma.bookCopy.count({
    where: { bookId: id, status: 'BORROWED' },
  });

  if (loanedCopiesCount > 0) {
    throw new ApiError(
      400,
      `Bu kitobning ${loanedCopiesCount} ta nusxasi ijarada. O'chirib bo'lmaydi.`,
    );
  }

  return prisma.book.delete({ where: { id } });
};

// #####################################################################
// ### KITOB NUSXALARI BILAN ISHLASH (YANGI FUNKSIYALAR) ###
// #####################################################################

/**
 * Kitobga yangi jismoniy nusxa qo'shadi.
 */
export const addBookCopy = async (bookId: string, barcode: string) => {
  await redisClient.del(`book:${bookId}`);
  return prisma.bookCopy.create({
    data: { bookId, barcode },
  });
};

/**
 * Bitta nusxaning ma'lumotlarini yangilaydi.
 */
export const updateBookCopy = async (
  copyId: string,
  data: Prisma.BookCopyUpdateInput,
) => {
  const copy = await prisma.bookCopy.findUnique({ where: { id: copyId } });
  if (!copy) throw new ApiError(404, 'Kitob nusxasi topilmadi');
  await redisClient.del(`book:${copy.bookId}`);
  return prisma.bookCopy.update({
    where: { id: copyId },
    data,
  });
};

/**
 * Bitta jismoniy nusxani o'chiradi.
 */
export const deleteBookCopy = async (copyId: string) => {
  return prisma.$transaction(async (tx) => {
    // 1. Nusxani topamiz
    const copy = await tx.bookCopy.findUnique({ where: { id: copyId } });
    if (!copy) {
      throw new ApiError(404, 'Kitob nusxasi topilmadi');
    }

    // 2. Agar nusxa hozirda ijarada bo'lsa, o'chirishga ruxsat bermaymiz
    if (copy.status === 'BORROWED' || copy.status === 'MAINTENANCE') {
      throw new ApiError(
        400,
        `Bu nusxaning holati "${copy.status}". Uni hozir o'chirib bo'lmaydi.`,
      );
    }

    // 3. Bu nusxaga bog'liq BARCHA ijara yozuvlarini topamiz
    const loans = await tx.loan.findMany({
      where: { bookCopyId: copyId },
      select: { id: true }, // Faqat IDlari kerak
    });
    const loanIds = loans.map((loan) => loan.id);

    // 4. Agar ijara yozuvlari mavjud bo'lsa:
    if (loanIds.length > 0) {
      // 4a. O'sha ijaralarga bog'liq jarimalarni o'chiramiz
      await tx.fine.deleteMany({
        where: { loanId: { in: loanIds } },
      });
      // 4b. So'ngra, ijara yozuvlarining o'zini o'chiramiz
      await tx.loan.deleteMany({
        where: { id: { in: loanIds } },
      });
    }

    // 5. Barcha bog'liqliklar o'chirilgach, nusxaning o'zini o'chiramiz
    const deletedCopy = await tx.bookCopy.delete({
      where: { id: copyId },
    });

    // 6. Asosiy kitobning keshini tozalaymiz
    await redisClient.del(`book:${copy.bookId}`);

    return deletedCopy;
  });
};

// #####################################################################
// ### REZERVTSIYA VA IZOHLAR ###
// #####################################################################

/**
 * Kitob nomini band qiladi. Bo'sh nusxa bo'lsa, uni tayinlaydi. Bo'lmasa, navbatga qo'yadi.
 * COMMENTED OUT - Reservation feature disabled
 */
/*
export const reserveBook = async (bookId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const activeReservation = await tx.reservation.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'AWAITING_PICKUP'] } },
    });
    if (activeReservation) {
      throw new ApiError(
        400,
        'Sizda allaqachon aktiv band qilingan kitob mavjud.',
      );
    }

    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) throw new ApiError(404, 'Kitob topilmadi.');

    // 1. Bo'sh nusxa qidiramiz
    const availableCopy = await tx.bookCopy.findFirst({
      where: { bookId, status: 'AVAILABLE' },
    });

    let reservation;
    if (availableCopy) {
      // 2a. Agar bo'sh nusxa topilsa, uni shu odamga tayinlaymiz
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // --- ENG MUHIM O'ZGARISH ---
      // Rezervatsiya yaratishda unga qaysi nusxa tayinlanganini ham yozib qo'yamiz
      reservation = await tx.reservation.create({
        data: {
          bookId,
          userId,
          status: 'AWAITING_PICKUP',
          expiresAt,
          assignedCopyId: availableCopy.id, // <-- SHU QATOR QO'SHILDI
        },
      });

      // Va o'sha nusxani vaqtincha "band qilingan" statusiga o'tkazamiz
      await tx.bookCopy.update({
        where: { id: availableCopy.id },
        data: { status: 'MAINTENANCE' },
      });

      // Foydalanuvchiga bildirishnoma yuboramiz
      await tx.notification.create({
        data: {
          userId,
          message: `Siz band qilgan "${book.title}" kitobi tayyor! Uni 48 soat ichida olib keting.`,
          type: NotificationType.RESERVATION_AVAILABLE,
        },
      });
    } else {
      // 2b. Agar bo'sh nusxa topilmasa, navbatga qo'yamiz
      reservation = await tx.reservation.create({
        data: { bookId, userId, status: 'ACTIVE' },
      });
      await tx.notification.create({
        data: {
          userId,
          message: `"${book.title}" kitobining barcha nusxalari band. Siz navbatga yozildingiz.`,
          type: NotificationType.INFO,
        },
      });
    }

    getIo().to(userId).emit('refetch_notifications');
    return reservation;
  });
};
*/

/**
 * Kitobga izoh qo'shadi (o'zgarishsiz)
 */
export const createComment = async (input: {
  bookId: string;
  userId: string;
  comment: string;
  rating?: number;
}) => {
  return prisma.bookComment.create({
    data: {
      comment: input.comment,
      rating: input.rating,
      book: { connect: { id: input.bookId } },
      user: { connect: { id: input.userId } },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

/**
 * Kitob izohlarini oladi (o'zgarishsiz)
 */
export const findCommentsByBookId = async (bookId: string) => {
  return prisma.bookComment.findMany({
    where: { bookId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

// #####################################################################
// ### EXCEL ORQALI OMMMAVIY QO'SHISH ###
// #####################################################################

/**
 * Excel fayli orqali kitoblar va ularning nusxalarini ommaviy qo'shadi.
 * Excelda "barcodes" degan ustun bo'lishi va unda shtrix-kodlar vergul bilan ajratilishi kerak.
 */
export const bulkCreateBooks = async (fileBuffer: Buffer) => {
  // 1. Excel faylni o'qish va JSON formatiga o'tkazish
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const booksJson = xlsx.utils.sheet_to_json(worksheet) as any[];

  if (!booksJson || booksJson.length === 0) {
    throw new ApiError(400, "Excel fayli bo'sh yoki noto'g'ri formatda.");
  }

  // 2. Mavjud kategoriyalarni olib, tezkor qidiruv uchun Mapga joylash
  const allCategories = await prisma.category.findMany();
  const categoryMap = new Map(
    allCategories.map((cat) => [cat.name.toLowerCase(), cat.id]),
  );
  const CATEGORIES_CACHE_KEY = 'categories:all';
  let newCategoriesCreated = false;

  // 3. Muvaffaqiyatli qo'shilgan yozuvlarni sanash uchun hisoblagichlar
  let createdBooksCount = 0;
  let createdCopiesCount = 0;

  // 4. Exceldagi har bir qator bo'yicha birma-bir ishlash
  for (const [index, row] of booksJson.entries()) {
    // Har bir qatorni alohida tranzaksiyada bajaramiz.
    // Bu agar bitta qatorda xatolik bo'lsa, faqat o'sha qator o'zgarishlari bekor bo'lishini ta'minlaydi.
    try {
      await prisma.$transaction(async (tx) => {
        // 4a. Majburiy maydonlarni tekshirish
        if (!row.title || !row.category || !row.barcodes) {
          throw new Error(
            `Excelning ${
              index + 2
            }-qatorida 'title', 'category' yoki 'barcodes' ustunlari to'ldirilmagan.`,
          );
        }

        // 4b. Kategoriyani topish yoki yangisini yaratish
        const categoryName = String(row.category).trim();
        let categoryId = categoryMap.get(categoryName.toLowerCase());
        if (!categoryId) {
          const newCategory = await tx.category.create({
            data: {
              name: categoryName,
              description: 'Excel orqali avtomatik yaratilgan',
            },
          });
          categoryId = newCategory.id;
          categoryMap.set(categoryName.toLowerCase(), newCategory.id);
          newCategoriesCreated = true;
        }

        // 4c. Kitob "pasporti" ma'lumotlarini tayyorlash
        const bookData = {
          title: String(row.title),
          author: row.author ? String(row.author) : null,
          description: row.description ? String(row.description) : null,
          publisher: row.publisher ? String(row.publisher) : null,
          publishedYear: row.publishedYear ? Number(row.publishedYear) : null,
          pageCount: row.pageCount ? Number(row.pageCount) : null,
          coverImage: null,
          categoryId: categoryId,
        };

        // 4d. Kitob "pasportini" yaratish
        const newBook = await tx.book.create({ data: bookData });

        // 4e. Shtrix-kodlarni ajratib olish va dublikatlarni tekshirish
        const barcodes = String(row.barcodes)
          .split(',')
          .map((bc) => bc.trim())
          .filter(Boolean);
        if (barcodes.length === 0) {
          throw new Error(
            `"${row.title}" kitobi uchun (${
              index + 2
            }-qator) shtrix-kodlar kiritilmagan.`,
          );
        }
        const existingBarcodes = await tx.bookCopy.findMany({
          where: { barcode: { in: barcodes } },
        });
        if (existingBarcodes.length > 0) {
          throw new Error(
            `Quyidagi shtrix-kodlar allaqachon mavjud: ${existingBarcodes
              .map((bc) => bc.barcode)
              .join(', ')}`,
          );
        }

        // 4f. Jismoniy nusxalarni yaratish
        const createdCopiesResult = await tx.bookCopy.createMany({
          data: barcodes.map((barcode) => ({
            bookId: newBook.id,
            barcode: barcode,
          })),
        });

        // 4g. Hisoblagichlarni yangilash
        createdBooksCount++;
        createdCopiesCount += createdCopiesResult.count;
      });
    } catch (error: any) {
      // Agar biror qatorda xatolik bo'lsa, butun jarayonni to'xtatib, tushunarli xabar beramiz
      throw new ApiError(
        400,
        error.message ||
          `Excel faylning ${index + 2}-qatorida xatolik yuz berdi.`,
      );
    }
  }

  // 5. Agar yangi kategoriya yaratilgan bo'lsa, keshni tozalash
  if (newCategoriesCreated) {
    await redisClient.del(CATEGORIES_CACHE_KEY);
    console.log(
      'Categories cache invalidated due to new categories from bulk import.',
    );
  }

  // 6. Ommaviy bildirishnoma yuborish
  if (createdBooksCount > 0) {
    const usersToNotify = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });

    if (usersToNotify.length > 0) {
      const notificationData = usersToNotify.map((user) => ({
        userId: user.id,
        message: `Kutubxonaga ${createdBooksCount} ta yangi nomdagi kitob (${createdCopiesCount} ta nusxada) qo'shildi! Katalog bilan tanishing.`,
        type: NotificationType.INFO,
      }));

      await prisma.notification.createMany({ data: notificationData });

      const io = getIo();
      io.to(usersToNotify.map((u) => u.id)).emit('refetch_notifications');
    }
  }

  // 7. Yakuniy natijani qaytarish
  return {
    message: `${createdBooksCount} ta kitob nomi va ${createdCopiesCount} ta nusxa muvaffaqiyatli qo'shildi.`,
    createdBooks: createdBooksCount,
    createdCopies: createdCopiesCount,
  };
};
