-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "expiryTime" TIMESTAMP(3);
