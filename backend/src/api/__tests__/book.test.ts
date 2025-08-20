import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import {
  getLibrarianToken,
  getRegularUserToken,
  cleanDatabase,
} from './helpers.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Book Routes', () => {
  let librarianToken: string;
  let userToken: string;
  let userId: string;
  let categoryId: string;

  beforeAll(async () => {
    await cleanDatabase();
    librarianToken = await getLibrarianToken();
    const regularUser = await getRegularUserToken();
    userToken = regularUser.token;
    userId = regularUser.userId;
  });

  beforeEach(async () => {
    await prisma.bookComment.deleteMany();
    await prisma.book.deleteMany();
    await prisma.category.deleteMany();

    const category = await prisma.category.create({
      data: { name: 'Test Category' },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/books', () => {
    it('should allow a librarian to create a new book with an image', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${librarianToken}`)
        .field('title', 'New Test Book')
        .field('author', 'Test Author')
        .field('categoryId', categoryId)
        .attach(
          'coverImage',
          path.resolve(__dirname, 'fixtures/test-image.png'),
        );

      expect(response.statusCode).toBe(201);
      expect(response.body.title).toBe('New Test Book');
      expect(response.body.coverImage).toContain(
        '/public/uploads/books/coverImage-',
      );
    });

    it('should not allow a regular user to create a book', async () => {
      const response = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Unauthorized Book')
        .field('author', 'Test Author')
        .field('categoryId', categoryId);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/books', () => {
    it('should return a paginated list of books', async () => {
      const booksData = Array.from({ length: 15 }, (_, i) => ({
        title: `Book ${i + 1}`,
        author: 'Author',
        categoryId,
      }));
      await prisma.book.createMany({ data: booksData });

      const response = await request(app).get('/api/v1/books').query({
        page: '2',
        limit: '5',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(5);
      expect(response.body.meta.total).toBe(15);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.totalPages).toBe(3);
    });

    it('should work with default parameters', async () => {
      const booksData = Array.from({ length: 3 }, (_, i) => ({
        title: `Default Test ${i + 1}`,
        author: 'Test Author',
        categoryId,
      }));
      await prisma.book.createMany({ data: booksData });

      const response = await request(app).get('/api/v1/books');

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(3);
      expect(response.body.meta.total).toBe(3);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should work with empty query parameters', async () => {
      const response = await request(app).get('/api/v1/books');
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('POST /api/v1/books/:bookId/comments', () => {
    it('should allow a logged-in user to post a comment', async () => {
      const book = await prisma.book.create({
        data: { title: 'Book for Commenting', author: 'Author', categoryId },
      });

      const response = await request(app)
        .post(`/api/v1/books/${book.id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          comment: 'This is my first comment',
          rating: 5,
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.comment).toBe('This is my first comment');
      expect(response.body.user.id).toBe(userId);
    });
  });
});
