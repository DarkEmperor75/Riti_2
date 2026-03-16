/*
  Warnings:

  - A unique constraint covering the columns `[attendeeId,eventId]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "ticketsSold" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "tickets_attendeeId_eventId_key" ON "tickets"("attendeeId", "eventId");
