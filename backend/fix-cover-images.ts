import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating books with default S3 cover to null...');
  
  const result = await prisma.book.updateMany({
    where: {
      coverImage: 'https://library-system-assets.s3.ap-northeast-1.amazonaws.com/uploads/books/default.png'
    },
    data: {
      coverImage: null
    }
  });
  
  console.log(`✅ Updated ${result.count} books to have null coverImage`);
  console.log('📱 These books will now display title text on their preview cards');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
