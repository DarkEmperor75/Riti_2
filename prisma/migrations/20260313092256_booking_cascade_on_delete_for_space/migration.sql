-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_spaceId_fkey";

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
