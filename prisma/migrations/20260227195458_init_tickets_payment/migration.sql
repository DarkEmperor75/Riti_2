/*
  Warnings:

  - You are about to drop the column `attendeeStripePaymentId` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "attendeeStripePaymentId",
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeTransferId" TEXT;
