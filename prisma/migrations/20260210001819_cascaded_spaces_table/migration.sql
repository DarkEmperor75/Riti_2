-- DropForeignKey
ALTER TABLE "spaces" DROP CONSTRAINT "spaces_vendorId_fkey";

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
