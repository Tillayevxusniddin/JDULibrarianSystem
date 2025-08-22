-- DropForeignKey
ALTER TABLE "public"."fines" DROP CONSTRAINT "fines_loanId_fkey";

-- AlterTable
ALTER TABLE "public"."fines" ALTER COLUMN "loanId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."fines" ADD CONSTRAINT "fines_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "public"."loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
