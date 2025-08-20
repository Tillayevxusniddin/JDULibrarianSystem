import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import {
  getLibrarianToken,
  getRegularUserToken,
  cleanDatabase,
} from './helpers.js';
import { Fine, User } from '@prisma/client';

describe('Fine Routes', () => {
  let librarianToken: string;
  let userToken: string;
  let user: User;
  let testFine: Fine;

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
    await cleanDatabase();

    await prisma.user.create({
      data: {
        email: 'librarian.basetest@example.com',
        password: 'password',
        firstName: 'Lib',
        lastName: 'Base',
        role: 'LIBRARIAN',
      },
    });
    const testUser = await prisma.user.create({
      data: {
        email: 'user.basetest@example.com',
        password: 'password',
        firstName: 'User',
        lastName: 'Base',
        role: 'USER',
        id: user.id,
      },
    });
    user = testUser;

    const category = await prisma.category.create({
      data: { name: 'Fine Test Category' },
    });
    const book = await prisma.book.create({
      data: {
        title: 'Fine Test Book',
        author: 'Author',
        categoryId: category.id,
      },
    });
    const loan = await prisma.loan.create({
      data: { bookId: book.id, userId: user.id, dueDate: new Date() },
    });
    testFine = await prisma.fine.create({
      data: {
        loanId: loan.id,
        userId: user.id,
        amount: 5000,
        reason: 'Test fine',
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/fines', () => {
    it('should allow a librarian to view all fines', async () => {
      const response = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
    });

    it('should not allow a regular user to view all fines', async () => {
      const response = await request(app)
        .get('/api/v1/fines')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/fines/my', () => {
    it('should allow a user to view their own fines', async () => {
      const response = await request(app)
        .get('/api/v1/fines/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testFine.id);
    });
  });

  describe('POST /api/v1/fines/:id/pay', () => {
    it('should allow a librarian to mark a fine as paid', async () => {
      const response = await request(app)
        .post(`/api/v1/fines/${testFine.id}/pay`)
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.isPaid).toBe(true);
      expect(response.body.data.paidAt).not.toBeNull();
    });

    it('should not allow a regular user to pay a fine', async () => {
      const response = await request(app)
        .post(`/api/v1/fines/${testFine.id}/pay`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(403);
    });

    it('should return a 404 error for a non-existent fine', async () => {
      const nonExistentFineId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/api/v1/fines/${nonExistentFineId}/pay`)
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});
