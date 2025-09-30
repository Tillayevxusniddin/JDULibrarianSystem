import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import { Prisma, NotificationType } from '@prisma/client';
import { getIo } from '../../utils/socket.js';
import ApiError from '../../utils/ApiError.js';
import { sendEmail } from '../../utils/sendEmail.js';
import fs from 'fs'; // Fayl tizimi bilan ishlash uchun
import path from 'path';
import xlsx from 'xlsx';

function randomPassword(length = 12): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export const findAllUsers = async (
  query: { search?: string },
  pagination: { page: number; limit: number },
) => {
  const { search } = query;
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const selectFields = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    isPremium: true, // <-- YECHIM: SHU QATOR QO'SHILDI
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: selectFields,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data: users, total };
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

export const createUser = async (
  input: Omit<Prisma.UserCreateInput, 'password'>,
) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new ApiError(409, 'Bu email manzil allaqachon ishlatilgan.');
  }

  // 1. Tasodifiy parol generatsiya qilamiz
  const plainPassword = randomPassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      ...input,
      password: hashedPassword, // Xeshlangan parolni saqlaymiz
    },
  });

  // 2. Foydalanuvchiga yangi parolni email orqali jo'natamiz
  try {
    await sendEmail({
      to: user.email,
      subject: 'Kutubxona Tizimiga Xush Kelibsiz!',
      html: `
        <h1>Assalomu alaykum, ${user.firstName}!</h1>
        <p>Siz uchun kutubxona tizimida yangi akkaunt yaratildi.</p>
        <p>Tizimga kirish uchun quyidagi ma'lumotlardan foydalanishingiz mumkin:</p>
        <ul>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Parol:</strong> ${plainPassword}</li>
        </ul>
        <p>Tizimga birinchi marta kirganingizdan so'ng parolni o'zgartirishni tavsiya etamiz.</p>
      `,
    });
  } catch (error) {
    console.error(`Foydalanuvchi ${user.email} uchun email yuborilmadi.`);
  }

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

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi.');
  }

  const imagePath = user.profilePicture;

  await prisma.$transaction(async (tx) => {
    // --- YANGI QO'SHILGAN MANTIQ START ---

    // 1. Foydalanuvchiga tegishli kanalni topamiz
    const channel = await tx.channel.findUnique({
      where: { ownerId: id },
      select: { id: true }, // Faqat ID'si kerak
    });

    // 2. Agar kanal mavjud bo'lsa, unga tegishli hamma narsani o'chiramiz
    if (channel) {
      // Kanaldagi postlarga bog'liq reaksiyalarni o'chiramiz
      await tx.postReaction.deleteMany({
        where: { post: { channelId: channel.id } },
      });

      // Kanaldagi postlarga bog'liq izohlarni o'chiramiz
      await tx.postComment.deleteMany({
        where: { post: { channelId: channel.id } },
      });

      // Kanaldagi postlarni o'chiramiz (va ularga bog'liq rasmlarni ham o'chirish kerak bo'ladi)
      // Hozircha faqat ma'lumotlar bazasidan o'chiramiz
      await tx.post.deleteMany({ where: { channelId: channel.id } });

      // Va nihoyat, kanalning o'zini o'chiramiz
      await tx.channel.delete({ where: { id: channel.id } });
    }

    // --- YANGI QO'SHILGAN MANTIQ END ---

    // Mavjud o'chirish logikasi
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.fine.deleteMany({ where: { userId: id } });
    await tx.bookComment.deleteMany({ where: { userId: id } });
    await tx.reservation.deleteMany({ where: { userId: id } });
    await tx.loan.deleteMany({ where: { userId: id } });
    await tx.bookSuggestion.deleteMany({ where: { userId: id } });

    // Eng oxirida foydalanuvchini o'chiramiz
    await tx.user.delete({ where: { id } });
  });

  // Rasm faylini o'chirish logikasi o'zgarishsiz qoladi
  if (imagePath) {
    try {
      const fullPath = path.join(process.cwd(), imagePath.substring(1));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Successfully deleted avatar: ${fullPath}`);
      }
    } catch (err) {
      console.error(`Failed to delete avatar ${imagePath}:`, err);
    }
  }
};

export const bulkCreateUsers = async (fileBuffer: Buffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const usersJson = xlsx.utils.sheet_to_json(worksheet) as any[];

  if (!usersJson || usersJson.length === 0) {
    throw new ApiError(400, 'Excel fayli bo`sh yoki noto`g`ri formatda.');
  }

  let createdCount = 0;
  const errors: string[] = [];

  // Har bir foydalanuvchini alohida yaratamiz, chunki har biriga email jo'natishimiz kerak
  for (const [index, userData] of usersJson.entries()) {
    if (!userData.firstName || !userData.lastName || !userData.email) {
      errors.push(
        `${
          index + 2
        }-qatorda majburiy maydonlar (firstName, lastName, email) to'ldirilmagan.`,
      );
      continue;
    }

    try {
      // createUser funksiyasini qayta ishlatamiz! Bu kod takrorlanishining oldini oladi.
      await createUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: 'USER',
      });
      createdCount++;
    } catch (error: any) {
      // Agar createUser xato qaytarsa (masalan, email mavjud bo'lsa)
      errors.push(`${index + 2}-qator (${userData.email}): ${error.message}`);
    }
  }

  return {
    totalInFile: usersJson.length,
    successfullyCreated: createdCount,
    errors: errors,
  };
};

export const updateUserPremiumStatus = async (
  userId: string,
  isPremium: boolean,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isPremium },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      profilePicture: true,
      isPremium: true,
      createdAt: true,
    },
  });

  console.log('🔄 Updated user premium status:', {
    userId,
    isPremium,
    userEmail: updatedUser.email,
  });

  // Foydalanuvchiga bildirishnoma yuborish
  const message = isPremium
    ? 'Tabriklaymiz! Sizga Premium tarif taqdim etildi. Endi o`z kanalingizni ochishingiz mumkin.'
    : 'Sizning Premium tarifingiz bekor qilindi.';

  const newNotification = await prisma.notification.create({
    data: {
      userId: userId,
      message: message,
      type: NotificationType.INFO,
    },
  });

  console.log('📝 Created notification:', {
    notificationId: newNotification.id,
    userId,
    message,
  });

  const io = getIo();

  // Socket event'larini yuborish
  console.log('📡 Sending socket events to room:', userId);

  // 1. Yangi bildirishnoma yuborish
  io.to(userId).emit('new_notification', newNotification);
  console.log('✅ Sent new_notification event');

  // 2. Premium status o'zgarganini bildirish
  io.to(userId).emit('premium_status_changed', {
    isPremium,
    message: `Premium status ${isPremium ? 'yoqildi' : "o'chirildi"}`,
  });
  console.log('✅ Sent premium_status_changed event');

  // 3. Auth ma'lumotlarini qayta yuklashni so'rash
  io.to(userId).emit('refetch_auth', {
    reason: 'premium_status_changed',
  });
  console.log('✅ Sent refetch_auth event');

  return updatedUser;
};
