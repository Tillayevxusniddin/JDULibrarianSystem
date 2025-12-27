-- CreateEnum
CREATE TYPE "FineIntervalUnit" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- AlterTable: Add new columns to library_settings
ALTER TABLE "library_settings" ADD COLUMN "fineIntervalUnit" "FineIntervalUnit" NOT NULL DEFAULT 'DAILY',
ADD COLUMN "fineIntervalDays" INTEGER;

-- AlterTable: Add finedForDate to fines table
ALTER TABLE "fines" ADD COLUMN "finedForDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex: Remove the unique constraint on loanId in fines table
DROP INDEX IF EXISTS "fines_loanId_key";

-- CreateIndex: Add composite unique constraint on (loanId, finedForDate)
CREATE UNIQUE INDEX "fines_loanId_finedForDate_key" ON "fines"("loanId", "finedForDate");
