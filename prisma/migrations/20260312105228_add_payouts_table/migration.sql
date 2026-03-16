-- CreateEnum
CREATE TYPE "PayoutActor" AS ENUM ('VENDOR', 'HOST');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "actorType" "PayoutActor" NOT NULL,
    "actorId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NOK',
    "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "PayoutStatus" NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payouts_actorType_actorId_idx" ON "payouts"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");
