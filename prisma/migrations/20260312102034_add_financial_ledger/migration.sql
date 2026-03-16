-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('BOOKING_PAYMENT', 'TICKET_PAYMENT', 'PLATFORM_FEE', 'PAYOUT', 'REFUND');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FinancialActor" AS ENUM ('VENDOR', 'HOST', 'ATTENDEE');

-- CreateTable
CREATE TABLE "financial_ledger" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "FinancialType" NOT NULL,
    "status" "FinancialStatus" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NOK',
    "actorType" "FinancialActor",
    "actorId" TEXT,
    "bookingId" TEXT,
    "ticketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_ledger_reference_key" ON "financial_ledger"("reference");

-- CreateIndex
CREATE INDEX "financial_ledger_type_idx" ON "financial_ledger"("type");

-- CreateIndex
CREATE INDEX "financial_ledger_actorType_actorId_idx" ON "financial_ledger"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "financial_ledger_createdAt_idx" ON "financial_ledger"("createdAt");
