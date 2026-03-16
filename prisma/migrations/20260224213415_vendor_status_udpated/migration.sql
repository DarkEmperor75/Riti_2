/*
  Warnings:

  - The values [PENDING_REVIEW] on the enum `VendorStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VendorStatus_new" AS ENUM ('APPROVED', 'REJECTED', 'SUSPENDED');
ALTER TABLE "public"."vendors" ALTER COLUMN "vendorStatus" DROP DEFAULT;
ALTER TABLE "vendors" ALTER COLUMN "vendorStatus" TYPE "VendorStatus_new" USING ("vendorStatus"::text::"VendorStatus_new");
ALTER TYPE "VendorStatus" RENAME TO "VendorStatus_old";
ALTER TYPE "VendorStatus_new" RENAME TO "VendorStatus";
DROP TYPE "public"."VendorStatus_old";
ALTER TABLE "vendors" ALTER COLUMN "vendorStatus" SET DEFAULT 'APPROVED';
COMMIT;

-- AlterTable
ALTER TABLE "vendors" ALTER COLUMN "vendorStatus" SET DEFAULT 'APPROVED';
