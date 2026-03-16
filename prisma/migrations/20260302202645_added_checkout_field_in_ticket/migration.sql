/*
  Warnings:

  - A unique constraint covering the columns `[stripeCheckoutSessionId]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "stripeCheckoutSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tickets_stripeCheckoutSessionId_key" ON "tickets"("stripeCheckoutSessionId");
