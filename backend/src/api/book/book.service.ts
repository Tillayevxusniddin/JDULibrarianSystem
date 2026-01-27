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
      copies: {
        orderBy: { barcode: 'asc' },
        include: {
          loans: {
            where: {
              status: { in: ['ACTIVE', 'OVERDUE'] },
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: { borrowedAt: 'desc' },
            take: 1,
          },
        },
      },
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
 * Excel/CSV fayli orqali kitoblar va ularning nusxalarini ommaviy qo'shadi.
 * Format: Barcode, Title, Author, Category
 */
export const bulkCreateBooks = async (fileBuffer: Buffer) => {
  // 1. Faylni o'qish (Headerga qaramasdan, array of arrays)
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  // header: 1 -> har bir qator array bo'ladi
  const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (!rawData || rawData.length === 0) {
    throw new ApiError(400, "Excel fayli bo'sh.");
  }

  // 2. Qatorlarni tozalash va formatlash
  // Header bor-yo'qligini aniqlash. Agar 1-qator "Barcode" yoki "Title" kabi so'zlarni o'z ichiga olsa, uni tashlab yuboramiz.
  // Lekin sample faylda header yo'q ("IT-1", ...).
  // Shuning uchun, oddiy qoida: agar 1-ustun "Barcode" ga o'xshasa (header nomi sifatida), skip qilamiz.
  let startIndex = 0;
  if (
    rawData[0][0] &&
    typeof rawData[0][0] === 'string' &&
    ['barcode', 'code', 'id', 'shtrix'].some((s) =>
      rawData[0][0].toLowerCase().includes(s),
    )
  ) {
    startIndex = 1;
  }

  const rowsToProcess = rawData.slice(startIndex).filter((row) => row.length > 0);

  // Natijalar
  const results = {
    createdBooks: 0,
    createdCopies: 0,
    failedRows: [] as any[],
  };

  // 3. Barcha shtrix-kodlarni yig'ib olish (dublikatlarni tekshirish uchun)
  const allBarcodesInFile = new Set<string>();
  // const duplicateBarcodesInFile = new Set<string>(); // Copilot: Unused, removed

  // Validatsiya qilingan va guruhlangan ma'lumotlar
  // Key: Title + Author (normalized) -> Value: { title, author, category, barcodes: [] }
  const booksMap = new Map<
    string,
    { title: string; author: string | null; category: string; barcodes: string[] }
  >();

  // 3a. Fayl ichidagi validatsiya va guruhlash
  for (let i = 0; i < rowsToProcess.length; i++) {
    const row = rowsToProcess[i];
    const originalRowIndex = startIndex + i + 1; // Foydalanuvchi uchun qator raqami

    // Sample mapping:
    // 0: Barcode (Required)
    // 1: Title (Required)
    // 2: Author (Optional)
    // 3: Category (Required)
    // 4: Language (Ignored)

    const barcode = row[0] ? String(row[0]).trim() : null;
    const title = row[1] ? String(row[1]).trim() : null;
    const author = row[2] ? String(row[2]).trim() : null;
    const category = row[3] ? String(row[3]).trim() : null;

    // Asosiy validatsiya
    if (!barcode || !title || !category) {
      results.failedRows.push({
        row: originalRowIndex,
        data: row,
        reason: "Barcode, Title yoki Category yetishmayapti.",
      });
      continue;
    }

    // Fayl ichidagi dublikat barcode
    if (allBarcodesInFile.has(barcode)) {
      // duplicateBarcodesInFile.add(barcode); // Removed
      results.failedRows.push({
        row: originalRowIndex,
        data: row,
        reason: `Fayl ichida takrorlangan shtrix-kod: ${barcode}`,
      });
      continue;
    }
    allBarcodesInFile.add(barcode);

    // Guruhlash
    // "Title|Author" - kalit
    const key = `${title.toLowerCase()}|${(author || '').toLowerCase()}`;
    
    if (!booksMap.has(key)) {
      booksMap.set(key, {
        title,
        author,
        category,
        barcodes: [],
      });
    } else {
      // Copilot suggestion: Category conflict detection
      const existing = booksMap.get(key)!;
      if (existing.category.toLowerCase() !== category.toLowerCase()) {
         results.failedRows.push({
          row: originalRowIndex,
          data: row,
          reason: `Bir xil Title/Author ("${title}") uchun turli Category topildi: "${existing.category}" va "${category}".`,
        });
        continue;
      }
    }
    booksMap.get(key)!.barcodes.push(barcode);
  }

  // 4. Bazadagi mavjud shtrix-kodlarni tekshirish
  if (allBarcodesInFile.size > 0) {
    const existingCopies = await prisma.bookCopy.findMany({
      where: {
        barcode: { in: Array.from(allBarcodesInFile) },
      },
      select: { barcode: true },
    });

    const existingBarcodeSet = new Set(existingCopies.map((c) => c.barcode));

    // Endi booksMap ichidan mavjud barcodelarni olib tashlaymiz
    for (const [key, bookData] of booksMap) {
      const validBarcodes: string[] = [];
      for (const bc of bookData.barcodes) {
        if (existingBarcodeSet.has(bc)) {
          results.failedRows.push({
             row: 'N/A', // Guruhlangan, aniq qatorni topish qiyinroq, lekin umumiy xato
             data: [bc, bookData.title],
             reason: `Shtrix-kod bazada allaqachon mavjud: ${bc}`
          });
        } else {
          validBarcodes.push(bc);
        }
      }
      bookData.barcodes = validBarcodes;
      
      // Agar barcha nusxalar invalid bo'lsa, bu kitobni mapdan o'chiramiz
      if (validBarcodes.length === 0) {
        booksMap.delete(key);
      }
    }
  }

  // 5. Kategoriyalarni tayyorlash
  const allCategories = await prisma.category.findMany();
  const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));
  let newCategoriesCreated = false;
  const bookIdsToInvalidate = new Set<string>();

  // 6. Kitoblarni yaratish yoki yangilash
  // Har bir guruh (kitob) uchun. Copilot: Use booksMap.values() to avoid unused key
  for (const bookData of booksMap.values()) {
    try {
      await prisma.$transaction(async (tx) => {
        // 6a. Kategoriya
        let categoryId = categoryMap.get(bookData.category.toLowerCase());
        if (!categoryId) {
          const newCat = await tx.category.create({
            data: {
              name: bookData.category,
              description: 'Ommaviy yuklash orqali yaratilgan',
            },
          });
          categoryId = newCat.id;
          categoryMap.set(bookData.category.toLowerCase(), categoryId);
          newCategoriesCreated = true;
        }

        // 6b. Kitob mavjudligini tekshirish (Title + Author)
        let bookId: string;
        
        // Izlash kriteriyasi
        const searchCriteria: Prisma.BookWhereInput = {
          title: { equals: bookData.title, mode: 'insensitive' },
        };
        if (bookData.author) {
            searchCriteria.author = { equals: bookData.author, mode: 'insensitive' };
        }

        const existingBook = await tx.book.findFirst({
          where: searchCriteria,
        });

        if (existingBook) {
          bookId = existingBook.id;
        } else {
          // Yangi kitob yaratish
          const newBook = await tx.book.create({
            data: {
              title: bookData.title,
              author: bookData.author,
              categoryId: categoryId,
              // Boshqa maydonlar bo'sh qoladi
            },
          });
          bookId = newBook.id;
          results.createdBooks++;
        }

        // 6c. Nusxalarni qo'shish
        if (bookData.barcodes.length > 0) {
           await tx.bookCopy.createMany({
             data: bookData.barcodes.map(bc => ({
               bookId,
               barcode: bc,
               status: 'AVAILABLE'
             }))
           });
           results.createdCopies += bookData.barcodes.length;
           
           // Keshni tozalash uchun ID ni saqlaymiz (Transaction ichida Redis chaqirmaymiz)
           bookIdsToInvalidate.add(bookId);
        }
      });
    } catch (error: any) {
      results.failedRows.push({
        row: 'Group',
        data: [bookData.title, bookData.author],
        reason: `Saqlashda xatolik: ${error.message}`,
      });
    }
  }

  // 7. Yakuniy tozalash va xabarlar
  
  // Redis keshini tozalash (Transactiondan tashqarida)
  if (newCategoriesCreated) {
    await redisClient.del('categories:all');
  }
  for (const bid of bookIdsToInvalidate) {
    await redisClient.del(`book:${bid}`);
  }

  // Copilot: Restore notifications
  if (results.createdBooks > 0) {
    const usersToNotify = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true },
    });

    if (usersToNotify.length > 0) {
      const notificationData = usersToNotify.map((user) => ({
        userId: user.id,
        message: `Kutubxonaga ${results.createdBooks} ta yangi nomdagi kitob (${results.createdCopies} ta nusxada) qo'shildi! Katalog bilan tanishing.`,
        type: NotificationType.INFO,
      }));

      // await prisma.notification.createMany({ data: notificationData }); // Optimize or batch if too large
      // Notificationlar juda ko'p bo'lsa, sekin ishlashi mumkin, lekin hozircha eski mantiqni qaytaramiz:
      await prisma.notification.createMany({ data: notificationData });

      const io = getIo();
      io.to(usersToNotify.map((u) => u.id)).emit('refetch_notifications');
    }
  }

  return {
    message: `Jarayon yakunlandi. Yaratilgan kitoblar: ${results.createdBooks} ta, nusxalar: ${results.createdCopies} ta, muvaffaqiyatsiz qatorlar: ${results.failedRows.length} ta.`,
    stats: {
      createdBooks: results.createdBooks,
      createdCopies: results.createdCopies,
      failedCount: results.failedRows.length,
    },
    failedRows: results.failedRows,
  };
};
