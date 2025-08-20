import request from 'supertest';
import app from '../../server.js';
import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';

export const cleanDatabase = async () => {
  await prisma.notification.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.bookComment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.bookSuggestion.deleteMany();
  await prisma.book.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
};

export const getLibrarianToken = async (): Promise<string> => {
  await cleanDatabase();

  const hashedPassword = await bcrypt.hash('librarianpass', 10);
  await prisma.user.create({
    data: {
      email: 'librarian.test@example.com',
      password: hashedPassword,
      firstName: 'Librarian',
      lastName: 'Test',
      role: 'LIBRARIAN',
    },
  });

  const response = await request(app).post('/api/v1/auth/login').send({
    email: 'librarian.test@example.com',
    password: 'librarianpass',
  });

  return response.body.token;
};

export const getRegularUserToken = async (): Promise<{
  token: string;
  userId: string;
}> => {
  const hashedPassword = await bcrypt.hash('regularpass', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user.test@example.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
    },
  });

  const response = await request(app).post('/api/v1/auth/login').send({
    email: 'user.test@example.com',
    password: 'regularpass',
  });

  return { token: response.body.token, userId: user.id };
};
