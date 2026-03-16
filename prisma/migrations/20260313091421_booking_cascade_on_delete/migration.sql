-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_renterId_fkey";

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
