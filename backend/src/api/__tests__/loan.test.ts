import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import {
  getLibrarianToken,
  getRegularUserToken,
  cleanDatabase,
} from './helpers.js';
import { Book, Category, User } from '@prisma/client';

describe('Loan Routes', () => {
  let librarianToken: string;
  let userToken: string;
  let user: User;
  let category: Category;
  let availableBook: Book;

  beforeAll(async () => {
    await cleanDatabase();
    librarianToken = await getLibrarianToken();
    const regularUserData = await getRegularUserToken();
    userToken = regularUserData.token;

    const foundUser = await prisma.user.findUnique({
      where: { id: regularUserData.userId },
    });
    if (foundUser) user = foundUser;
  });

  beforeEach(async () => {
    await prisma.loan.deleteMany();
    await prisma.book.deleteMany();
    await prisma.category.deleteMany();

    category = await prisma.category.create({
      data: { name: 'Loan Test Category' },
    });
    availableBook = await prisma.book.create({
      data: {
        title: 'Available Book',
        author: 'Test Author',
        categoryId: category.id,
        status: 'AVAILABLE',
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/loans', () => {
    it('should allow a librarian to create a loan for an available book', async () => {
      const response = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ bookId: availableBook.id, userId: user.id });

      expect(response.statusCode).toBe(201);
      const bookAfterLoan = await prisma.book.findUnique({
        where: { id: availableBook.id },
      });
      expect(bookAfterLoan?.status).toBe('BORROWED');
    });

    it('should return an error when trying to loan a borrowed book', async () => {
      await prisma.book.update({
        where: { id: availableBook.id },
        data: { status: 'BORROWED' },
      });

      const response = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ bookId: availableBook.id, userId: user.id });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain(
        'This book is not available for loan',
      );
    });

    it('should return an error if the user has reached the borrowing limit', async () => {
      for (let i = 0; i < 5; i++) {
        const book = await prisma.book.create({
          data: {
            title: `Limit Book ${i}`,
            author: 'Author',
            categoryId: category.id,
            status: 'BORROWED',
          },
        });
        await prisma.loan.create({
          data: {
            bookId: book.id,
            userId: user.id,
            dueDate: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      const response = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ bookId: availableBook.id, userId: user.id });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain(
        'You can only borrow up to 5 books at a time.',
      );
    });
  });

  describe('GET /api/v1/loans/my', () => {
    it('should allow a user to view their own loans', async () => {
      await prisma.loan.create({
        data: {
          bookId: availableBook.id,
          userId: user.id,
          dueDate: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/v1/loans/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBe(1);
    });
  });

  describe('Return and Renewal Workflow', () => {
    it('should allow a user to return a book and a librarian to confirm it', async () => {
      const loan = await prisma.loan.create({
        data: {
          bookId: availableBook.id,
          userId: user.id,
          dueDate: new Date(),
        },
      });
      await prisma.book.update({
        where: { id: availableBook.id },
        data: { status: 'BORROWED' },
      });

      const returnResponse = await request(app)
        .post(`/api/v1/loans/${loan.id}/return`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(returnResponse.statusCode).toBe(200);
      expect(returnResponse.body.status).toBe('PENDING_RETURN');

      const confirmResponse = await request(app)
        .post(`/api/v1/loans/${loan.id}/confirm-return`)
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(confirmResponse.statusCode).toBe(200);
      expect(confirmResponse.body.status).toBe('RETURNED');

      const bookAfterReturn = await prisma.book.findUnique({
        where: { id: availableBook.id },
      });
      expect(bookAfterReturn?.status).toBe('AVAILABLE');
    });
  });
});
