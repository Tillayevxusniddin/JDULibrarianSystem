import prisma from '../../config/db.config.js';
import bcrypt from 'bcrypt';
import { Prisma, NotificationType } from '@prisma/client';
import { getIo } from '../../utils/socket.js';
import ApiError from '../../utils/ApiError.js';
import { sendEmail } from '../../utils/sendEmail.js';
import fs from 'fs'; // Fayl tizimi bilan ishlash uchun
import path from 'path';
import xlsx from 'xlsx';

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

  // Barcha kerakli maydonlar borligini tekshirish
  for (const user of usersJson) {
    if (!user.firstName || !user.lastName || !user.email || !user.password) {
      throw new ApiError(
        400,
        'Excel faylida barcha kerakli ustunlar (firstName, lastName, email, password) bo`lishi shart.',
      );
    }
  }

  // Parollarni xeshlash
  const usersWithHashedPasswords = await Promise.all(
    usersJson.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(String(user.password), 10),
      role: 'USER', // Barcha ommaviy qo'shilganlar oddiy USER bo'ladi
    })),
  );

  // Ommaviy tarzda bazaga qo'shish
  // skipDuplicates: true - agar email allaqachon mavjud bo'lsa, xatolik bermasdan o'tkazib yuboradi
  const result = await prisma.user.createMany({
    data: usersWithHashedPasswords,
    skipDuplicates: true,
  });

  return result; // Bu yerda nechta yozuv qo'shilgani haqida ma'lumot qaytadi
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
