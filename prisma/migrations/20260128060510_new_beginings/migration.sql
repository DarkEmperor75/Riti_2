/*
  Warnings:

  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `space_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spaces` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tickets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_hostId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "space_bookings" DROP CONSTRAINT "space_bookings_attendeeId_fkey";

-- DropForeignKey
ALTER TABLE "space_bookings" DROP CONSTRAINT "space_bookings_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "spaces" DROP CONSTRAINT "spaces_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_attendeeId_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_eventId_fkey";

-- DropTable
DROP TABLE "events";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "space_bookings";

-- DropTable
DROP TABLE "spaces";

-- DropTable
DROP TABLE "tickets";
