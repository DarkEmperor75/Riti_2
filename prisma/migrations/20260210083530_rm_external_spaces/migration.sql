/*
  Warnings:

  - You are about to drop the column `externalSpaceAddresss` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `isSpaceExternal` on the `events` table. All the data in the column will be lost.
  - Made the column `bookingId` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_bookingId_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "externalSpaceAddresss",
DROP COLUMN "isSpaceExternal",
ALTER COLUMN "bookingId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
