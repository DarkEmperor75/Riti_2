/*
  Warnings:

  - The `stripePaymentStatus` column on the `bookings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StripePaymentStatus" AS ENUM ('INITIATED', 'COMPLETED');

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "stripePaymentStatus",
ADD COLUMN     "stripePaymentStatus" "StripePaymentStatus";

-- CreateIndex
CREATE INDEX "bookings_status_endTime_idx" ON "bookings"("status", "endTime");
