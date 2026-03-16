-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_bookingId_fkey";

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "bookingId" DROP NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "capacity" DROP NOT NULL,
ALTER COLUMN "eventType" SET DEFAULT 'FREE',
ALTER COLUMN "payoutStatus" SET DEFAULT 'UNINITIATED';

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
