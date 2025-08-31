-- AlterTable
ALTER TABLE "public"."books" ADD COLUMN     "availableCopies" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "totalCopies" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "author" DROP NOT NULL;
