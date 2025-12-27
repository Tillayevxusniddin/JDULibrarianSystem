import cron from 'node-cron';
import prisma from '../config/db.config.js';
import { LoanStatus, NotificationType, FineIntervalUnit } from '@prisma/client';
import { getIo } from '../utils/socket.js';

/**
 * Helper function to calculate interval in days based on interval unit
 * 
 * Interval rules:
 * - DAILY: 1 day
 * - WEEKLY: 7 days
 * - MONTHLY: 30 days (fixed, not calendar month)
 * - CUSTOM: configurable via fineIntervalDays setting
 */
function getIntervalDays(unit: FineIntervalUnit, customDays?: number | null): number {
  switch (unit) {
    case FineIntervalUnit.DAILY:
      return 1;
    case FineIntervalUnit.WEEKLY:
      return 7;
    case FineIntervalUnit.MONTHLY:
      return 30; // Using 30 days for monthly interval
    case FineIntervalUnit.CUSTOM:
      return customDays || 1; // Fallback to 1 if custom days not set
    default:
      return 1;
  }
}

/**
 * Normalize date to midnight UTC for consistent date comparisons
 * This ensures timezone-independent fine generation
 */
function normalizeToMidnight(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Interval-Based Fine Generation System with Catch-up Mechanism
 * 
 * ALGORITHM OVERVIEW:
 * ====================
 * This cron job generates fines for overdue loans based on configurable intervals.
 * Each fine entry represents a specific time period (day/week/month/custom).
 * 
 * KEY FEATURES:
 * 1. Interval-Based: Fines are generated per interval, not per loan
 * 2. Catch-up: If cron misses days, it calculates and generates all missed interval fines
 * 3. Idempotent: Uses unique constraint (loanId, finedForDate) to prevent duplicate fines
 * 4. Respects returnDate: Doesn't generate fines after book is returned
 * 
 * FINE CALCULATION:
 * - Fine amount per interval = fineAmountPerDay × intervalDays
 * - Example: If fineAmountPerDay=5000 and interval=WEEKLY(7 days), each fine = 35,000 som
 * 
 * INTERVAL DETERMINATION:
 * - lastFineDate: Query latest fine for the loan (orderBy finedForDate desc)
 * - If exists: startFineDate = lastFineDate + intervalDays
 * - If not exists: startFineDate = dueDate + 1 day
 * - endDate = min(now, returnDate if exists)
 * 
 * INTERVAL GENERATION:
 * - totalIntervals = floor((endDate - startFineDate) / intervalMs) + 1
 * - For each interval: finedForDate = startFineDate + (i × intervalDays)
 * - Create fine if not exists (unique constraint prevents duplicates)
 * 
 * EDGE CASES HANDLED:
 * - enableFines=false: Skip fine generation
 * - Not overdue: Skip fine generation
 * - After returnDate: Don't generate fines
 * - Duplicate prevention: Unique constraint on (loanId, finedForDate)
 * - Timezone handling: Normalize all dates to UTC midnight
 */
export const startDueDateChecker = () => {
  console.log('🗓️ Due date checker cron job enabled.');

  cron.schedule('0 1 * * *', async () => {
    console.log('⏳ Checking for overdue and upcoming due loans...');
    const io = getIo();

    // Fetch library settings
    const settings = await prisma.librarySettings.findFirst();
    const enableFines = settings?.enableFines ?? true;
    const fineAmountPerDay = settings?.fineAmountPerDay ?? 5000;
    const intervalUnit = settings?.fineIntervalUnit ?? FineIntervalUnit.DAILY;
    const intervalDays = getIntervalDays(intervalUnit, settings?.fineIntervalDays);
    const fineAmountPerInterval = Number(fineAmountPerDay) * intervalDays;

    const today_start = normalizeToMidnight(new Date());

    const commonInclude = {
      bookCopy: {
        include: {
          book: {
            select: { title: true },
          },
        },
      },
    };

    // Ertaga muddati tugaydigan ijaralar
    const loansDueTomorrow = await prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: {
          gte: new Date(today_start.getTime() + 24 * 60 * 60 * 1000),
          lt: new Date(today_start.getTime() + 48 * 60 * 60 * 1000),
        },
      },
      include: commonInclude,
    });

    // Muddati o'tib ketgan ijaralar (including OVERDUE status to catch up)
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: { in: [LoanStatus.ACTIVE, LoanStatus.OVERDUE] },
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

    // 2. Muddati o'tganlar uchun interval-based jarima solish
    for (const loan of overdueLoans) {
      await prisma.$transaction(async (tx) => {
        // Update loan status to OVERDUE if not already
        if (loan.status !== LoanStatus.OVERDUE) {
          await tx.loan.update({
            where: { id: loan.id },
            data: { status: LoanStatus.OVERDUE },
          });

          // Send overdue notification only once
          const overdueMessage = `Sizning "${loan.bookCopy.book.title}" kitobini qaytarish muddatingiz o'tib ketdi! Jarima qo'llanilishi mumkin.`;
          const newNotification = await tx.notification.create({
            data: {
              userId: loan.userId,
              message: overdueMessage,
              type: NotificationType.FINE,
            },
          });
          io.to(loan.userId).emit('new_notification', newNotification);
        }

        // Skip fine generation if fines are disabled
        if (!enableFines) {
          return;
        }

        // Determine the end date for fine calculation
        const endDate = loan.returnedAt 
          ? normalizeToMidnight(loan.returnedAt)
          : today_start;

        // Don't generate fines if the book is returned or if not overdue
        if (endDate <= normalizeToMidnight(loan.dueDate)) {
          return;
        }

        // Find the last fine date for this loan
        const lastFine = await tx.fine.findFirst({
          where: { loanId: loan.id },
          orderBy: { finedForDate: 'desc' },
        });

        // Determine the starting date for fine calculation
        let startFineDate: Date;
        if (lastFine) {
          // Start from the day after the last fined period
          startFineDate = new Date(lastFine.finedForDate);
          startFineDate.setDate(startFineDate.getDate() + intervalDays);
        } else {
          // Start from the day after the due date
          startFineDate = normalizeToMidnight(loan.dueDate);
          startFineDate.setDate(startFineDate.getDate() + 1);
        }

        // Calculate how many intervals have passed
        const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
        const timeDiff = endDate.getTime() - startFineDate.getTime();
        
        if (timeDiff < 0) {
          // No new intervals to fine
          return;
        }

        const intervalsToGenerate = Math.floor(timeDiff / intervalMs) + 1;

        // Generate fines for each interval
        for (let i = 0; i < intervalsToGenerate; i++) {
          const finedForDate = new Date(startFineDate);
          finedForDate.setDate(finedForDate.getDate() + (i * intervalDays));

          // Don't fine beyond the end date
          if (finedForDate > endDate) {
            break;
          }

          try {
            // Try to create the fine (unique constraint prevents duplicates)
            await tx.fine.create({
              data: {
                amount: fineAmountPerInterval,
                reason: `"${loan.bookCopy.book.title}" kitobini o'z vaqtida qaytarmaganlik uchun (${finedForDate.toLocaleDateString()}).`,
                loanId: loan.id,
                userId: loan.userId,
                finedForDate: finedForDate,
              },
            });
            console.log(`Fine created for loan ${loan.id} for date ${finedForDate.toISOString()}`);
          } catch (error: any) {
            // If unique constraint violation, skip (fine already exists for this period)
            if (error.code === 'P2002') {
              console.log(`Fine already exists for loan ${loan.id} for date ${finedForDate.toISOString()}`);
            } else {
              throw error;
            }
          }
        }
      });
    }

    console.log('✅ Due date check complete.');
  });
};
