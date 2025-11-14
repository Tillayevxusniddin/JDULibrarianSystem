const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.book.updateMany({
    where: {
      coverImage: 'https://library-system-assets.s3.ap-northeast-1.amazonaws.com/uploads/books/default.png'
    },
    data: {
      coverImage: null
    }
  });
  
  console.log(`Updated ${result.count} books to have null coverImage`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
