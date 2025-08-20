-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('ACTIVE', 'AWAITING_PICKUP', 'FULFILLED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."reservations" ADD COLUMN     "status" "public"."ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "expiresAt" DROP NOT NULL;
