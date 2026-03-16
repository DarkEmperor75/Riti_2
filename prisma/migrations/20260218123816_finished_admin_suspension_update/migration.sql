-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'SUSPENDED';

-- AlterEnum
ALTER TYPE "VendorStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;
