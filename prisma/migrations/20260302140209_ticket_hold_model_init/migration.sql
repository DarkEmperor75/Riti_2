/*
  Warnings:

  - The values [REFUNDED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TicketPaymentStatus" AS ENUM ('NOT_STARTED', 'INITIATED', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('IN_PROGRESS', 'PURCHASED', 'EXPIRED', 'CANCELLED');
ALTER TABLE "tickets" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "paymentAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "TicketPaymentStatus" NOT NULL DEFAULT 'NOT_STARTED',
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';

-- CreateIndex
CREATE INDEX "hosts_stripeAccountId_idx" ON "hosts"("stripeAccountId");

-- CreateIndex
CREATE INDEX "hosts_stripeDisabledReason_idx" ON "hosts"("stripeDisabledReason");

-- CreateIndex
CREATE INDEX "hosts_stripeDetailsSubmitted_idx" ON "hosts"("stripeDetailsSubmitted");

-- CreateIndex
CREATE INDEX "hosts_stripePayoutsEnabled_stripeChargesEnabled_idx" ON "hosts"("stripePayoutsEnabled", "stripeChargesEnabled");

-- CreateIndex
CREATE INDEX "hosts_stripeOnboardingCompletedAt_idx" ON "hosts"("stripeOnboardingCompletedAt");

-- CreateIndex
CREATE INDEX "vendors_stripeAccountId_idx" ON "vendors"("stripeAccountId");

-- CreateIndex
CREATE INDEX "vendors_stripeDisabledReason_idx" ON "vendors"("stripeDisabledReason");

-- CreateIndex
CREATE INDEX "vendors_stripeDetailsSubmitted_idx" ON "vendors"("stripeDetailsSubmitted");

-- CreateIndex
CREATE INDEX "vendors_stripePayoutsEnabled_stripeChargesEnabled_idx" ON "vendors"("stripePayoutsEnabled", "stripeChargesEnabled");
