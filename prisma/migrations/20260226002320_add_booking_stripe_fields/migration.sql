/*
  Warnings:

  - A unique constraint covering the columns `[stripeCheckoutSessionId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeChargeId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeTransferId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "applicationFeeAmount" INTEGER,
ADD COLUMN     "payoutReleasedAt" TIMESTAMP(3),
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripePaymentStatus" TEXT,
ADD COLUMN     "stripeTransferId" TEXT,
ADD COLUMN     "vendorPayoutAmount" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_stripeCheckoutSessionId_key" ON "bookings"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_stripePaymentIntentId_key" ON "bookings"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_stripeChargeId_key" ON "bookings"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_stripeTransferId_key" ON "bookings"("stripeTransferId");
