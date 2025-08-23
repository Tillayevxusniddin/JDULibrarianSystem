import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding process started...');

  // 1. Standart Menejerni yaratish
  const managerEmail = 'manager@university.com';
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: managerEmail },
    update: {}, // Agar mavjud bo'lsa, hech narsani o'zgartirmaymiz
    create: {
      email: managerEmail,
      firstName: 'Main',
      lastName: 'Manager',
      password: managerPassword,
      role: Role.MANAGER,
      status: 'ACTIVE',
    },
  });
  console.log('Manager user created or already exists.');

  // 2. Standart Kutubxonachini yaratish (sizning kodingiz asosida)
  const adminEmail = 'librarian@university.com';
  const adminPassword = 'SuperStrongPassword123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: 'Main',
      lastName: 'Librarian',
      password: hashedPassword,
      role: Role.LIBRARIAN,
      status: 'ACTIVE',
    },
  });
  console.log('Librarian user created or already exists.');

  // 3. Test uchun oddiy foydalanuvchi yaratish
  const userEmail = 'user@university.com';
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      firstName: 'Regular',
      lastName: 'User',
      password: userPassword,
      role: Role.USER,
      status: 'ACTIVE',
    },
  });
  console.log('Regular user created or already exists.');

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
