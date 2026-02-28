-- CreateTable
CREATE TABLE "library_settings" (
    "id" TEXT NOT NULL,
    "enableFines" BOOLEAN NOT NULL DEFAULT true,
    "fineAmountPerDay" DECIMAL(10,2) NOT NULL DEFAULT 5000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_settings_pkey" PRIMARY KEY ("id")
);
