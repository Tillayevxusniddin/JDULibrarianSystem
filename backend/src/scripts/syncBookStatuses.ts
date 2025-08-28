import { PrismaClient } from '@prisma/client';
import { recomputeBookStatus } from '../utils/bookStatus.js';

const prisma = new PrismaClient();

async function main() {
  const books = await prisma.book.findMany({ select: { id: true } });
  let updated = 0;
  for (const b of books) {
    await recomputeBookStatus(prisma as any, b.id);
    updated++;
  }
  console.log(`Synchronized status for ${updated} books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

