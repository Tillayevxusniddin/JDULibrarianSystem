import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import { cleanDatabase } from './helpers.js';

describe('Auth Routes', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
        },
      });
    });

    it('should return a token for a valid user with correct credentials', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe('Login successful');
    });

    it('should return a 401 error for incorrect password', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return a 401 error for a non-existent email', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'nouser@example.com',
        password: 'password123',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token: string;
    let user: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = await prisma.user.create({
        data: {
          email: 'me@example.com',
          password: hashedPassword,
          firstName: 'Get',
          lastName: 'Me',
          role: 'USER',
        },
      });

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'me@example.com',
        password: 'password123',
      });

      token = loginResponse.body.token;
    });

    it('should return user data for a valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      // --- TUZATISH SHU YERDA ---
      // Javob to'g'ridan-to'g'ri foydalanuvchi obyekti bo'lgani uchun,
      // `response.body.user` o'rniga `response.body` ni tekshiramiz.
      expect(response.body.id).toBe(user.id);
      expect(response.body.role).toBe('USER');
      expect(response.body.email).toBe('me@example.com');
    });

    it('should return a 401 error for requests without a token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.statusCode).toBe(401);
    });
  });
});
