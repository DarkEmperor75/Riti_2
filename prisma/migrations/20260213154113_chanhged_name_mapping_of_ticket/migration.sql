/*
  Warnings:

  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_attendeeId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_eventId_fkey";

-- DropTable
DROP TABLE "Ticket";

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "attendeeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketType" "TicketType" NOT NULL,
    "pricePaid" DECIMAL(65,30) NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "isRefunded" BOOLEAN NOT NULL DEFAULT false,
    "attendeeStripePaymentId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
