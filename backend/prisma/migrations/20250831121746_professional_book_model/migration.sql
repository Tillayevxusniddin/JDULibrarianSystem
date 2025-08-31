/*
  Warnings:

  - You are about to drop the column `availableCopies` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `totalCopies` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `bookId` on the `loans` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookCopyId]` on the table `loans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookId,userId,status]` on the table `reservations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookCopyId` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BookCopyStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST');

-- DropForeignKey
ALTER TABLE "public"."book_comments" DROP CONSTRAINT "book_comments_bookId_fkey";

-- DropForeignKey
ALTER TABLE "public"."channels" DROP CONSTRAINT "channels_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."loans" DROP CONSTRAINT "loans_bookId_fkey";

-- DropIndex
DROP INDEX "public"."reservations_bookId_userId_key";

-- AlterTable
ALTER TABLE "public"."books" DROP COLUMN "availableCopies",
DROP COLUMN "status",
DROP COLUMN "totalCopies";

-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "bookId",
ADD COLUMN     "bookCopyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."reservations" ADD COLUMN     "assignedCopyId" TEXT;

-- DropEnum
DROP TYPE "public"."BookStatus";

-- CreateTable
CREATE TABLE "public"."book_copies" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "status" "public"."BookCopyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_copies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_copies_barcode_key" ON "public"."book_copies"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "loans_bookCopyId_key" ON "public"."loans"("bookCopyId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_bookId_userId_status_key" ON "public"."reservations"("bookId", "userId", "status");

-- AddForeignKey
ALTER TABLE "public"."channels" ADD CONSTRAINT "channels_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_copies" ADD CONSTRAINT "book_copies_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_bookCopyId_fkey" FOREIGN KEY ("bookCopyId") REFERENCES "public"."book_copies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."book_comments" ADD CONSTRAINT "book_comments_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
