/*
  Warnings:

  - The values [CONFIRMED,REJECTED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUSPENDED] on the enum `VendorStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amenities` on the `spaces` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `spaces` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SpaceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'UNDER_REVIEW', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('STUDIO', 'HALL', 'GALLERY', 'WORKSHOP', 'AUDITORIUM', 'CONFERENCE_ROOM', 'BOARDROOM', 'OFFICE', 'LIBRARY', 'LABORATORY', 'THEATER', 'EXHIBITION_SPACE', 'COMMUNITY_CENTER', 'FITNESS_CENTER', 'YOGA_STUDIO', 'RETAIL_SPACE', 'RESTAURANT', 'OUTDOOR_SPACE', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'SOLD_OUT';

-- AlterEnum
BEGIN;
CREATE TYPE "VendorStatus_new" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."vendors" ALTER COLUMN "vendorStatus" DROP DEFAULT;
ALTER TABLE "vendors" ALTER COLUMN "vendorStatus" TYPE "VendorStatus_new" USING ("vendorStatus"::text::"VendorStatus_new");
ALTER TYPE "VendorStatus" RENAME TO "VendorStatus_old";
ALTER TYPE "VendorStatus_new" RENAME TO "VendorStatus";
DROP TYPE "public"."VendorStatus_old";
ALTER TABLE "vendors" ALTER COLUMN "vendorStatus" SET DEFAULT 'PENDING_REVIEW';
COMMIT;

-- AlterTable
ALTER TABLE "spaces" DROP COLUMN "amenities",
DROP COLUMN "city",
ADD COLUMN     "instructions" TEXT[],
ADD COLUMN     "rules" TEXT[],
ADD COLUMN     "spaceType" "SpaceType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "status" "SpaceStatus" NOT NULL DEFAULT 'UNDER_REVIEW';
