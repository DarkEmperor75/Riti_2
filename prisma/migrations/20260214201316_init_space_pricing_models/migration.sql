-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "minBookingDurationHours" INTEGER,
ADD COLUMN     "minLeadTimeHours" INTEGER,
ADD COLUMN     "multiDayBookingAllowed" BOOLEAN;
