/*
  Warnings:

  - A unique constraint covering the columns `[stripeRefundId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripeRefundId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_stripeRefundId_key" ON "bookings"("stripeRefundId");
