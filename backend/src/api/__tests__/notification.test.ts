import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import { getRegularUserToken, cleanDatabase } from './helpers.js';
import { User } from '@prisma/client';

describe('Notification Routes', () => {
  let userAToken: string;
  let userA: User;
  let userBToken: string;
  let userB: User;

  beforeAll(async () => {
    await cleanDatabase();
    const userAData = await getRegularUserToken();
    userAToken = userAData.token;
    let foundUserA = await prisma.user.findUnique({
      where: { id: userAData.userId },
    });
    if (foundUserA) userA = foundUserA;

    const userBData = await prisma.user.create({
      data: {
        email: 'userB@example.com',
        password: 'password',
        firstName: 'User',
        lastName: 'B',
      },
    });
    const loginResponseB = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'userB@example.com', password: 'password' });
    userBToken = loginResponseB.body.token;
    let foundUserB = await prisma.user.findUnique({
      where: { email: 'userB@example.com' },
    });
    if (foundUserB) userB = foundUserB;
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.notification.createMany({
      data: [
        { message: 'First message for A', userId: userA.id, type: 'INFO' },
        { message: 'Second message for A', userId: userA.id, type: 'WARNING' },
      ],
    });
    await prisma.notification.create({
      data: { message: 'Single message for B', userId: userB.id, type: 'INFO' },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/v1/notifications', () => {
    it('should allow a user to see only their own notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0].message).toContain('for A');
      expect(response.body[1].message).toContain('for A');
    });
  });

  describe('POST /api/v1/notifications/:id/read', () => {
    it('should allow a user to mark their own notification as read', async () => {
      const notification = await prisma.notification.findFirst({
        where: { userId: userA.id },
      });

      await request(app)
        .post(`/api/v1/notifications/${notification!.id}/read`)
        .set('Authorization', `Bearer ${userAToken}`);

      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification!.id },
      });
      expect(updatedNotification?.isRead).toBe(true);
    });

    it("should not allow a user to read another user's notification", async () => {
      const notificationOfB = await prisma.notification.findFirst({
        where: { userId: userB.id },
      });

      await request(app)
        .post(`/api/v1/notifications/${notificationOfB!.id}/read`)
        .set('Authorization', `Bearer ${userAToken}`);

      const notificationOfBAfter = await prisma.notification.findUnique({
        where: { id: notificationOfB!.id },
      });
      expect(notificationOfBAfter?.isRead).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/read-all', () => {
    it('should mark all notifications of a user as read', async () => {
      await request(app)
        .post(`/api/v1/notifications/read-all`)
        .set('Authorization', `Bearer ${userAToken}`);

      const notificationsOfA = await prisma.notification.findMany({
        where: { userId: userA.id },
      });
      const notificationOfB = await prisma.notification.findFirst({
        where: { userId: userB.id },
      });

      expect(notificationsOfA.every((n) => n.isRead)).toBe(true);
      expect(notificationOfB?.isRead).toBe(false);
    });
  });
});
