/*
  Warnings:

  - You are about to drop the column `isbn` on the `books` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."books_isbn_key";

-- AlterTable
ALTER TABLE "public"."books" DROP COLUMN "isbn";
