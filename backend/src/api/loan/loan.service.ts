import prisma from '../../config/db.config.js';
import ApiError from '../../utils/ApiError.js';
import { Prisma } from '@prisma/client';
import redisClient from '../../config/redis.config.js';
import {
  NotificationType,
  BookCopyStatus,
  LoanStatus,
  ReservationStatus,
} from '@prisma/client';
import { getIo } from '../../utils/socket.js';
import { BORROWING_LIMIT, LOAN_DURATION_DAYS } from '../../config/constants.js';

/**
 * Kitob nusxasini shtrix-kodi bo'yicha ijaraga beradi.
 * @param barcode - Ijaraga berilayotgan jismoniy nusxaning shtrix-kodi
 * @param userId - Ijaraga olayotgan foydalanuvchining IDsi
 */
export const createLoan = async (barcode: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    // 1. Foydalanuvchining shaxsiy cheklovlarini tekshirish
    const activeLoansCount = await tx.loan.count({
      where: { userId, status: 'ACTIVE' },
    });
    if (activeLoansCount >= BORROWING_LIMIT) {
      throw new ApiError(
        400,
        `Siz ${BORROWING_LIMIT} tagacha kitob olishingiz mumkin.`,
      );
    }
    const overdueLoan = await tx.loan.findFirst({
      where: { userId, status: 'OVERDUE' },
    });
    if (overdueLoan) {
      throw new ApiError(400, "Muddati o'tgan kitobingiz bor. Uni qaytaring.");
    }

    // 2. Shtrix-kod bo'yicha kitobning jismoniy nusxasini topamiz
    const bookCopy = await tx.bookCopy.findUnique({ where: { barcode } });
    if (!bookCopy) {
      throw new ApiError(
        404,
        'Bunday shtrix-kodga ega kitob nusxasi topilmadi.',
      );
    }

    await redisClient.del(`book:${bookCopy.bookId}`);

    // 3. Nusxaning holatini tekshirish
    if (bookCopy.status === BookCopyStatus.BORROWED) {
      throw new ApiError(400, 'Bu nusxa allaqachon ijaraga berilgan.');
    }
    if (bookCopy.status === BookCopyStatus.LOST) {
      throw new ApiError(400, "Bu nusxa yo'qolgan deb belgilangan.");
    }

    // COMMENTED OUT - Reservation feature disabled
    // Agar nusxa 'AVAILABLE' bo'lmasa, demak u 'MAINTENANCE' (rezervdagi) holatida.
    // U aynan shu foydalanuvchi uchun band qilinganini tekshiramiz.
    /*
    if (bookCopy.status === BookCopyStatus.MAINTENANCE) {
      const reservation = await tx.reservation.findFirst({
        where: {
          userId,
          assignedCopyId: bookCopy.id,
          status: ReservationStatus.AWAITING_PICKUP,
        },
      });
      if (!reservation) {
        throw new ApiError(
          400,
          `Bu nusxa boshqa foydalanuvchi uchun band qilingan.`,
        );
      }
      // Agar topilsa, rezervatsiyani bajarilgan deb belgilaymiz
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.FULFILLED },
      });
    }
    */

    // 4. Barcha tekshiruvlardan so'ng, nusxaning statusini 'BORROWED'ga o'zgartiramiz.
    // BU YERDA XATO BO'LMASLIGI SHART!
    await tx.bookCopy.update({
      where: { id: bookCopy.id },
      data: { status: BookCopyStatus.BORROWED },
    });

    // 5. Yangi ijara yozuvini yaratamiz
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

    return tx.loan.create({
      data: { userId, bookCopyId: bookCopy.id, dueDate, status: 'ACTIVE' },
      include: {
        bookCopy: { include: { book: true } },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  });
};
/**
 * Lazily refresh loan and reservation statuses.
 *
 * - Marks `ACTIVE` loans as `OVERDUE` when `dueDate` < now.
 * - Expires reservations in `AWAITING_PICKUP` whose `expiresAt` < now,
 *   then either assigns the copy to the next person in queue or makes the copy available.
 *
 * This is intentionally idempotent and throttled with Redis so it can safely be
 * run on user requests (e.g., when someone opens their loans page) instead of
 * via a cron job.
 */
export const lazyRefreshLoanStatuses = async (userId?: string) => {
  const LOCK_KEY = userId ? `lazy-refresh:loans:user:${userId}` : 'lazy-refresh:loans:global';
  // short-lived lock to avoid running concurrently / too often
  let lockAcquired = false;
  try {
    const res = await redisClient.set(LOCK_KEY, '1', { NX: true, EX: 30 });
    // Node Redis returns 'OK' when the key was set, or null when not set (lock already held)
    if (!res) {
      // someone else holds the lock; skip this refresh
      return;
    }
    lockAcquired = true;
  } catch (err) {
    // Redis is unavailable or errored while acquiring the lock.
    // Proceed with a best-effort refresh rather than failing the request.
    // Note: without a lock there is a risk of concurrent refreshes, but that's acceptable
    // for a best-effort lazy update triggered on user requests.
    console.warn(
      'Could not acquire Redis lock for lazy loan refresh; proceeding without lock.',
      err,
    );
  }

  try {
    const now = new Date();

    // 1) Mark active loans as OVERDUE if past due date
    const overdueWhere: Prisma.LoanWhereInput = {
      status: 'ACTIVE',
      dueDate: { lt: now },
    };
    if (userId) (overdueWhere as any).userId = userId;

    await prisma.loan.updateMany({
      where: overdueWhere,
      data: { status: 'OVERDUE' },
    });

    // 2) Process reservations that awaited pickup and have expired
    // Cap how many expired reservations we handle in a single request to avoid
    // long-running responses when the system has many expirations to process.
    const PROCESS_LIMIT = 20;
    const expiredWhere: any = {
      status: ReservationStatus.AWAITING_PICKUP,
      expiresAt: { lt: now },
    };
    if (userId) expiredWhere.userId = userId;

    const expiredReservations = await prisma.reservation.findMany({
      where: expiredWhere,
      include: { book: true },
      orderBy: { expiresAt: 'asc' }, // handle oldest expirations first
      take: PROCESS_LIMIT,
    });

    for (const reservation of expiredReservations) {
      // Handle each expired reservation in its own transaction so we can safely
      // assign the copy to the next user or mark it available.
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.reservation.findUnique({ where: { id: reservation.id } });
        if (!fresh || fresh.status !== ReservationStatus.AWAITING_PICKUP || !fresh.assignedCopyId) return;

        // Cancel this expired reservation and clear assignment
        await tx.reservation.update({
          where: { id: fresh.id },
          data: { status: 'CANCELLED', assignedCopyId: null, expiresAt: null },
        });

        // Find next in queue (if any)
        const nextInQueue = await tx.reservation.findFirst({
          where: { bookId: fresh.bookId, status: 'ACTIVE' },
          orderBy: { reservedAt: 'asc' },
          include: { book: true },
        });

        if (nextInQueue) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48);
          await tx.reservation.update({
            where: { id: nextInQueue.id },
            data: {
              status: ReservationStatus.AWAITING_PICKUP,
              assignedCopyId: fresh.assignedCopyId,
              expiresAt,
            },
          });

          await tx.bookCopy.update({
            where: { id: fresh.assignedCopyId },
            data: { status: BookCopyStatus.MAINTENANCE },
          });

          const newNotification = await tx.notification.create({
            data: {
              userId: nextInQueue.userId,
              message: `Siz navbatda turgan "${nextInQueue.book.title}" kitobi bo'shadi! Uni 48 soat ichida olib keting.`,
              type: 'RESERVATION_AVAILABLE',
            },
          });

          getIo().to(nextInQueue.userId).emit('new_notification', newNotification);
        } else {
          // No one waiting — make the copy available
          await tx.bookCopy.update({
            where: { id: fresh.assignedCopyId },
            data: { status: BookCopyStatus.AVAILABLE },
          });
        }
      });

      // Invalidate Redis cache for the affected book so subsequent reads reflect the updated copy status
      await redisClient.del(`book:${reservation.bookId}`);
    }
  } catch (err) {
    // Log but don't throw — this is a best-effort refresh to keep responses snappy.
    console.error('lazyRefreshLoanStatuses error:', err);
  } finally {
    // If we actually acquired the lock, try to release it early (TTL will also clear it).
    if (lockAcquired) {
      try {
        await redisClient.del(LOCK_KEY);
      } catch (e) {
        /* ignore */
      }
    }
  }
};

/**
 * Foydalanuvchining barcha ijralarini topadi.
 */
export const findUserLoans = async (
  userId: string,
  statusFilter?: 'active' | 'history',
) => {
  // Ensure the user's loan/reservation statuses are up-to-date when they open the page.
  await lazyRefreshLoanStatuses(userId);

  const where: Prisma.LoanWhereInput = { userId };

  if (statusFilter === 'active') {
    where.status = { in: ['ACTIVE', 'OVERDUE', 'PENDING_RETURN'] };
  } else if (statusFilter === 'history') {
    where.status = { in: ['RETURNED'] };
  }

  return prisma.loan.findMany({
    where,
    include: {
      bookCopy: { include: { book: true } },
    },
    orderBy: { borrowedAt: 'desc' },
  });
};

/**
 * Barcha ijralar ro'yxatini oladi.
 */
export const findAllLoans = async (
  filter?: 'pending' | 'renewal' | 'active' | 'history',
) => {
  // A global refresh before returning admin/librarian lists ensures data freshness.
  await lazyRefreshLoanStatuses();

  const where: Prisma.LoanWhereInput = {};

  if (filter === 'pending') where.status = 'PENDING_RETURN';
  else if (filter === 'renewal') where.renewalRequested = true;
  else if (filter === 'active') where.status = { in: ['ACTIVE', 'OVERDUE'] };
  else if (filter === 'history') where.status = 'RETURNED';

  return prisma.loan.findMany({
    where,
    include: {
      bookCopy: { include: { book: true } },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { borrowedAt: 'desc' },
  });
};

/**
 * Foydalanuvchi kitobni qaytarishni boshlaydi (tasdiqlash uchun)
 */
export const initiateReturn = async (loanId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { user: true, bookCopy: { include: { book: true } } },
    });
    if (!loan) throw new ApiError(404, 'Ijara topilmadi.');
    if (loan.userId !== userId)
      throw new ApiError(
        403,
        "Faqat o'zingizga tegishli ijarani qaytara olasiz.",
      );
    if (!['ACTIVE', 'OVERDUE'].includes(loan.status))
      throw new ApiError(400, "Bu ijarani qaytarib bo'lmaydi.");

    await tx.bookCopy.update({
      where: { id: loan.bookCopyId },
      data: { status: BookCopyStatus.MAINTENANCE },
    });

    const updatedLoan = await tx.loan.update({
      where: { id: loanId },
      data: { status: 'PENDING_RETURN' },
    });

    const librarians = await tx.user.findMany({ where: { role: 'LIBRARIAN' } });
    const notificationData = librarians.map((lib) => ({
      userId: lib.id,
      message: `Foydalanuvchi ${loan.user.firstName} "${loan.bookCopy.book.title}" kitobini qaytarish uchun belgiladi.`,
      type: NotificationType.INFO,
    }));
    await tx.notification.createMany({ data: notificationData });

    getIo()
      .to(librarians.map((l) => l.id))
      .emit('refetch_notifications');

    return updatedLoan;
  });
};

/**
 * Kutubxonachi kitob qaytarilganini tasdiqlaydi.
 */
export const confirmReturn = async (loanId: string) => {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { bookCopy: true },
    });
    if (!loan) throw new ApiError(404, 'Ijara topilmadi.');
    await redisClient.del(`book:${loan.bookCopy.bookId}`);

    if (loan.status !== 'PENDING_RETURN')
      throw new ApiError(400, 'Bu ijara qaytarish uchun belgilanmagan.');

    const bookId = loan.bookCopy.bookId;

    // COMMENTED OUT - Reservation feature disabled
    // Check if there's a reservation queue and assign book to next person
    /*
    const nextInQueue = await tx.reservation.findFirst({
      where: { bookId, status: 'ACTIVE' },
      orderBy: { reservedAt: 'asc' },
      include: { book: true },
    });

    if (nextInQueue) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      await tx.reservation.update({
        where: { id: nextInQueue.id },
        data: {
          status: 'AWAITING_PICKUP',
          assignedCopyId: loan.bookCopyId,
          expiresAt,
        },
      });

      await tx.bookCopy.update({
        where: { id: loan.bookCopyId },
        data: { status: BookCopyStatus.MAINTENANCE }, // Olib ketish kutilayotgan holatga o'tadi
      });

      const newNotification = await tx.notification.create({
        data: {
          userId: nextInQueue.userId,
          message: `Siz navbatda turgan "${nextInQueue.book.title}" kitobi bo'shadi! Uni 48 soat ichida olib keting.`,
          type: 'RESERVATION_AVAILABLE',
        },
      });

      getIo().to(nextInQueue.userId).emit('new_notification', newNotification);
    } else {
      await tx.bookCopy.update({
        where: { id: loan.bookCopyId },
        data: { status: BookCopyStatus.AVAILABLE },
      });
    }
    */

    // Without reservation feature, just make the book available
    await tx.bookCopy.update({
      where: { id: loan.bookCopyId },
      data: { status: BookCopyStatus.AVAILABLE },
    });

    return tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        renewalRequested: false,
      },
    });
  });
};

/**
 * Kutubxonachi tomonidan to'g'ridan-to'g'ri kitobni qaytarish (ACTIVE yoki OVERDUE ijaralar uchun)
 */
export const directReturn = async (loanId: string) => {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { id: loanId },
      include: { bookCopy: true, user: true },
    });
    if (!loan) throw new ApiError(404, 'Ijara topilmadi.');

    if (!['ACTIVE', 'OVERDUE'].includes(loan.status))
      throw new ApiError(
        400,
        'Faqat aktiv yoki muddati o\'tgan ijaralarni qaytarish mumkin.',
      );

    await redisClient.del(`book:${loan.bookCopy.bookId}`);

    const bookId = loan.bookCopy.bookId;

    // COMMENTED OUT - Reservation feature disabled
    // Check if there's a reservation queue and assign book to next person
    /*
    const nextInQueue = await tx.reservation.findFirst({
      where: { bookId, status: 'ACTIVE' },
      orderBy: { reservedAt: 'asc' },
      include: { book: true },
    });

    if (nextInQueue) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      await tx.reservation.update({
        where: { id: nextInQueue.id },
        data: {
          status: 'AWAITING_PICKUP',
          assignedCopyId: loan.bookCopyId,
          expiresAt,
        },
      });

      await tx.bookCopy.update({
        where: { id: loan.bookCopyId },
        data: { status: BookCopyStatus.MAINTENANCE },
      });

      const newNotification = await tx.notification.create({
        data: {
          userId: nextInQueue.userId,
          message: `Siz navbatda turgan "${nextInQueue.book.title}" kitobi bo'shadi! Uni 48 soat ichida olib keting.`,
          type: 'RESERVATION_AVAILABLE',
        },
      });

      getIo().to(nextInQueue.userId).emit('new_notification', newNotification);
    } else {
      await tx.bookCopy.update({
        where: { id: loan.bookCopyId },
        data: { status: BookCopyStatus.AVAILABLE },
      });
    }
    */

    // Without reservation feature, just make the book available
    await tx.bookCopy.update({
      where: { id: loan.bookCopyId },
      data: { status: BookCopyStatus.AVAILABLE },
    });

    return tx.loan.update({
      where: { id: loanId },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        renewalRequested: false,
      },
      include: {
        bookCopy: { include: { book: true } },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  });
};

/**
 * Foydalanuvchi ijara muddatini uzaytirishni so'raydi
 */
export const requestRenewal = async (loanId: string, userId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { user: true, bookCopy: { include: { book: true } } },
  });
  if (!loan) throw new ApiError(404, 'Ijara topilmadi.');
  if (loan.userId !== userId)
    throw new ApiError(403, "Faqat o'z ijarangiz uchun so'rov yubora olasiz.");
  if (loan.status !== 'ACTIVE')
    throw new ApiError(
      400,
      'Faqat aktiv ijaralar muddatini uzaytirish mumkin.',
    );
  if (loan.renewalRequested)
    throw new ApiError(400, "Bu ijara uchun allaqachon so'rov yuborilgan.");

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: { renewalRequested: true },
  });

  const librarians = await prisma.user.findMany({
    where: { role: 'LIBRARIAN' },
  });
  const notificationData = librarians.map((lib) => ({
    userId: lib.id,
    message: `Foydalanuvchi ${loan.user.firstName} "${loan.bookCopy.book.title}" kitobi uchun muddat uzaytirishni so'radi.`,
    type: NotificationType.INFO,
  }));
  await prisma.notification.createMany({ data: notificationData });
  getIo()
    .to(librarians.map((l) => l.id))
    .emit('refetch_notifications');

  return updatedLoan;
};

/**
 * Kutubxonachi muddatni uzaytirishni tasdiqlaydi
 */
export const approveRenewal = async (loanId: string, newDueDate: Date) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { bookCopy: { include: { book: true } } },
  });
  if (!loan) throw new ApiError(404, 'Ijara topilmadi.');
  // if (!loan.renewalRequested)
  //   throw new ApiError(400, "Bu ijara uchun muddat uzaytirish so'ralmagan.");

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: { dueDate: newDueDate, renewalRequested: false, status: 'ACTIVE' },
  });

  const newNotification = await prisma.notification.create({
    data: {
      userId: loan.userId,
      message: `Sizning "${loan.bookCopy.book.title}" kitobi uchun muddat uzaytirish so'rovingiz tasdiqlandi.`,
      type: 'INFO',
    },
  });
  getIo().to(loan.userId).emit('new_notification', newNotification);

  return updatedLoan;
};

/**
 * Kutubxonachi muddatni uzaytirishni rad etadi
 */
export const rejectRenewal = async (loanId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { bookCopy: { include: { book: true } } },
  });
  if (!loan) throw new ApiError(404, 'Ijara topilmadi.');
  // if (!loan.renewalRequested)
  //   throw new ApiError(400, "Bu ijara uchun muddat uzaytirish so'ralmagan.");

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: { renewalRequested: false },
  });

  const newNotification = await prisma.notification.create({
    data: {
      userId: loan.userId,
      message: `Afsuski, sizning "${loan.bookCopy.book.title}" kitobi uchun muddat uzaytirish so'rovingiz rad etildi.`,
      type: 'WARNING',
    },
  });
  getIo().to(loan.userId).emit('new_notification', newNotification);

  return updatedLoan;
};
