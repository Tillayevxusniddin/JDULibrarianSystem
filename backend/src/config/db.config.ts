import { PrismaClient } from '@prisma/client';

// PrismaClient'dan faqat bitta nusxa yaratilishi uchun
// global best practice
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
