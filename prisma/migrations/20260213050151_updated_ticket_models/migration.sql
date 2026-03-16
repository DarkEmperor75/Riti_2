/*
  Warnings:

  - Added the required column `pricePaid` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticketType` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isStudent` to the `attendees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('REGULAR', 'STUDENT');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "attendeeStripePaymentId" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "pricePaid" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "ticketType" "TicketType" NOT NULL;

-- AlterTable
ALTER TABLE "attendees" ADD COLUMN     "isStudent" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "studentDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0;
