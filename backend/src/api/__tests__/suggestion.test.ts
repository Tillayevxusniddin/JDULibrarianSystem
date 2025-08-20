import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import {
  getLibrarianToken,
  getRegularUserToken,
  cleanDatabase,
} from './helpers.js';

describe('Suggestion Routes', () => {
  let librarianToken: string;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    await cleanDatabase();
    librarianToken = await getLibrarianToken();
    const regularUserData = await getRegularUserToken();
    userToken = regularUserData.token;
    userId = regularUserData.userId;
  });

  beforeEach(async () => {
    await prisma.bookSuggestion.deleteMany();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/suggestions', () => {
    it('should allow a logged-in user to create a new suggestion', async () => {
      const suggestionData = {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
      };

      const response = await request(app)
        .post('/api/v1/suggestions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(suggestionData);

      expect(response.statusCode).toBe(201);
      expect(response.body.title).toBe(suggestionData.title);
      expect(response.body.userId).toBe(userId);
    });

    it('should return a 401 error for creating a suggestion without a token', async () => {
      const response = await request(app)
        .post('/api/v1/suggestions')
        .send({ title: 'Unauthorized Suggestion' });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/suggestions', () => {
    it('should allow a librarian to view all suggestions', async () => {
      await prisma.bookSuggestion.create({
        data: { title: 'Test Suggestion', userId },
      });

      const response = await request(app)
        .get('/api/v1/suggestions')
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
    });

    it('should not allow a regular user to view all suggestions', async () => {
      const response = await request(app)
        .get('/api/v1/suggestions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PUT /api/v1/suggestions/:id', () => {
    let suggestionId: string;

    beforeEach(async () => {
      const suggestion = await prisma.bookSuggestion.create({
        data: { title: 'Suggestion to Update', userId },
      });
      suggestionId = suggestion.id;
    });

    it("should allow a librarian to update a suggestion's status to APPROVED", async () => {
      const response = await request(app)
        .put(`/api/v1/suggestions/${suggestionId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ status: 'APPROVED' });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('APPROVED');
    });

    it('should return a 400 validation error for an invalid status', async () => {
      const response = await request(app)
        .put(`/api/v1/suggestions/${suggestionId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(response.statusCode).toBe(400);
      expect(response.body.messages[0]).toContain(
        "Status must be one of: 'PENDING', 'APPROVED', or 'REJECTED'",
      );
    });
  });
});
