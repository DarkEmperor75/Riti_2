/*
  Warnings:

  - You are about to drop the `vendor_application` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "vendor_application" DROP CONSTRAINT "vendor_application_vendorId_fkey";

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "adminReason" TEXT;

-- DropTable
DROP TABLE "vendor_application";
