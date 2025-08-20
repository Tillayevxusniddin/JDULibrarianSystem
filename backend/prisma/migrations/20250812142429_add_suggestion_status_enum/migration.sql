/*
  Warnings:

  - The `status` column on the `book_suggestions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."book_suggestions" DROP COLUMN "status",
ADD COLUMN     "status" "public"."SuggestionStatus" NOT NULL DEFAULT 'PENDING';
