import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import ApiError from '../../utils/ApiError.js';
import { sendEmail } from '../../utils/sendEmail.js';

export const findAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const searchUsers = async (searchTerm: string) => {
  if (!searchTerm) {
    return [];
  }
  return prisma.user.findMany({
    where: {
      role: 'USER',
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    take: 10,
  });
};

export const createUser = async (input: Prisma.UserCreateInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new ApiError(409, 'This email is already in use.');
  }

  // Muhim: Parolni xeshlashdan oldin, uni email'ga yuborish uchun saqlab qolamiz
  const plainPassword = input.password;

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      ...input,
      password: hashedPassword,
    },
  });

  // --- YANGI QO'SHIMCHA: EMAIL YUBORISH ---
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to the University Library System!',
      html: `
        <h1>Welcome, ${user.firstName}!</h1>
        <p>Your account has been created successfully by a librarian.</p>
        <p>You can now log in using the following credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Password:</strong> ${plainPassword}</li>
        </ul>
        <p>We recommend changing your password after your first login.</p>
        <br>
        <p>Thank you!</p>
      `,
    });
  } catch (error) {
    console.error(`Foydalanuvchi ${user.email} uchun email yuborilmadi.`);
    // Bu yerda xatolik bo'lsa ham, foydalanuvchi yaratilgani uchun jarayonni to'xtatmaymiz.
  }
  // --- QO'SHIMCHA TUGADI ---

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi.');
  }
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
    },
  });
};

// --- YANGI FUNKSIYA ---
export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi.');
  }

  // Foydalanuvchiga bog'liq barcha ma'lumotlarni bitta tranzaksiyada o'chiramiz
  return prisma.$transaction(async (tx) => {
    // Avval "bolalar"ni o'chiramiz
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.fine.deleteMany({ where: { userId: id } });
    await tx.bookComment.deleteMany({ where: { userId: id } });
    await tx.reservation.deleteMany({ where: { userId: id } });
    await tx.loan.deleteMany({ where: { userId: id } });
    await tx.bookSuggestion.deleteMany({ where: { userId: id } });

    // Keyin foydalanuvchining o'zini o'chiramiz
    await tx.user.delete({ where: { id } });
  });
};
