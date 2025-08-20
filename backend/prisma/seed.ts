import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding process started...');

  const adminEmail = 'librarian@university.com';
  const adminPassword = 'SuperStrongPassword123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists. Seeding stopped.');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      firstName: 'Main',
      lastName: 'Librarian',
      password: hashedPassword,
      role: 'LIBRARIAN',
      status: 'ACTIVE',
    },
  });

  console.log('Head Librarian created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
