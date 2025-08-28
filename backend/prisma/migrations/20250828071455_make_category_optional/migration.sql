-- DropForeignKey
ALTER TABLE "public"."books" DROP CONSTRAINT "books_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."books" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."books" ADD CONSTRAINT "books_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
