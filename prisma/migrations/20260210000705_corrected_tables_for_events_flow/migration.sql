/*
  Warnings:

  - You are about to drop the `event_images` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stripeAccountId]` on the table `attendees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventDate` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventType` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payoutStatus` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PURCHASED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNINITIATED', 'PROCESSING', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "event_images" DROP CONSTRAINT "event_images_eventId_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_bookingId_fkey";

-- AlterTable
ALTER TABLE "attendees" ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "coverImg" TEXT,
ADD COLUMN     "eventDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "eventType" "EventType" NOT NULL,
ADD COLUMN     "externalSpaceAddresss" TEXT,
ADD COLUMN     "isSpaceExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutStatus" "PaymentStatus" NOT NULL,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- DropTable
DROP TABLE "event_images";

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "isRefunded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendees_stripeAccountId_key" ON "attendees"("stripeAccountId");

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
