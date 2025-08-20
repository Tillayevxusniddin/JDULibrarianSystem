import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import { getLibrarianToken, cleanDatabase } from '../__tests__/helpers.js';

describe('Category Routes', () => {
  let librarianToken: string;

  beforeAll(async () => {
    librarianToken = await getLibrarianToken();
  });

  afterEach(async () => {
    await prisma.category.deleteMany();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/categories', () => {
    it('should return a list of all categories', async () => {
      await prisma.category.createMany({
        data: [{ name: 'Fiction' }, { name: 'Science Fiction' }],
      });

      const response = await request(app).get('/api/v1/categories');

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should allow a librarian to create a new category', async () => {
      const newCategory = {
        name: 'History',
        description: 'A collection of historical books.',
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send(newCategory);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe(newCategory.name);
    });

    it('should return a 401 error for requests without a token', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Unauthorized' });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('should allow a librarian to update an existing category', async () => {
      const category = await prisma.category.create({
        data: { name: 'Old Name' },
      });

      const response = await request(app)
        .put(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ name: 'New Name' });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('New Name');
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should allow a librarian to delete an existing category', async () => {
      const category = await prisma.category.create({
        data: { name: 'Category to Delete' },
      });

      const response = await request(app)
        .delete(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.statusCode).toBe(204);

      const deletedCategory = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(deletedCategory).toBeNull();
    });
  });
});
