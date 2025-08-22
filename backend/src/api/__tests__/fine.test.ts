import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import {
  getLibrarianToken,
  getRegularUserToken,
  cleanDatabase,
} from './helpers.js';

// Cron job ichidagi mantiqni testda to'g'ridan-to'g'ri chaqirish uchun alohida funksiya
const checkDueDatesManually = async () => {
  const today_start = new Date();
  today_start.setHours(0, 0, 0, 0);

  const overdueLoans = await prisma.loan.findMany({
    where: {
      status: 'ACTIVE',
      dueDate: { lt: today_start },
    },
    include: { book: true },
  });

  for (const loan of overdueLoans) {
    await prisma.$transaction(async (tx) => {
      await tx.loan.update({
        where: { id: loan.id },
        data: { status: 'OVERDUE' },
      });
      await tx.notification.create({
        data: {
          userId: loan.userId,
          message: `The due date for the book "${loan.book.title}" is overdue! A fine may be applied.`,
          type: 'FINE',
        },
      });
      const existingFine = await tx.fine.findFirst({
        where: { loanId: loan.id },
      });
      if (!existingFine) {
        await tx.fine.create({
          data: {
            amount: 5000,
            reason: `For not returning the book "${loan.book.title}" on time.`,
            loanId: loan.id,
            userId: loan.userId,
          },
        });
      }
    });
  }
};

describe('Automatic Fine Creation Logic', () => {
  let user: { token: string; userId: string };
  let book: any;
  let category: any;

  beforeAll(async () => {
    await cleanDatabase();
    // Test uchun kerakli foydalanuvchi, kategoriya va kitobni yaratib olamiz
    user = await getRegularUserToken();
    category = await prisma.category.create({
      data: { name: 'Fine Logic Test Category' },
    });
    book = await prisma.book.create({
      data: {
        title: 'Book for Automatic Fine Test',
        author: 'Author Logic',
        categoryId: category.id,
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('should automatically create a fine when a loan becomes overdue', async () => {
    // 1. Muddati ataylab o'tkazib yuborilgan ijara yaratamiz
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const loan = await prisma.loan.create({
      data: {
        bookId: book.id,
        userId: user.userId,
        dueDate: twoDaysAgo, // Qaytarish muddati 2 kun oldin o'tib ketgan
        status: 'ACTIVE',
      },
    });

    // 2. Cron job'dagi mantiqni qo'lda ishga tushiramiz
    await checkDueDatesManually();

    // 3. Natijalarni tekshiramiz
    // Jarima yaratildimi?
    const fine = await prisma.fine.findFirst({ where: { loanId: loan.id } });
    expect(fine).not.toBeNull();
    expect(fine?.userId).toBe(user.userId);

    // Ijara statusi "OVERDUE" bo'ldimi?
    const updatedLoan = await prisma.loan.findUnique({
      where: { id: loan.id },
    });
    expect(updatedLoan?.status).toBe('OVERDUE');

    // Foydalanuvchiga bildirishnoma bordimi?
    const notification = await prisma.notification.findFirst({
      where: { userId: user.userId, type: 'FINE' },
    });
    expect(notification).not.toBeNull();
  });
});
