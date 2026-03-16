-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SpaceAmenities" ADD VALUE 'SCREEN';
ALTER TYPE "SpaceAmenities" ADD VALUE 'MICROPHONES';
ALTER TYPE "SpaceAmenities" ADD VALUE 'STAGE';
ALTER TYPE "SpaceAmenities" ADD VALUE 'FLIPCHART';
ALTER TYPE "SpaceAmenities" ADD VALUE 'DIMMABLE_LIGHTING';
ALTER TYPE "SpaceAmenities" ADD VALUE 'SEATING';
ALTER TYPE "SpaceAmenities" ADD VALUE 'TABLES';
ALTER TYPE "SpaceAmenities" ADD VALUE 'FLEXIBLE_LAYOUT';
ALTER TYPE "SpaceAmenities" ADD VALUE 'MATS';
ALTER TYPE "SpaceAmenities" ADD VALUE 'CUSHIONS';
ALTER TYPE "SpaceAmenities" ADD VALUE 'MIRRORS';
ALTER TYPE "SpaceAmenities" ADD VALUE 'TOILETS';
ALTER TYPE "SpaceAmenities" ADD VALUE 'CHANGING_ROOM';
ALTER TYPE "SpaceAmenities" ADD VALUE 'SHOWER';
ALTER TYPE "SpaceAmenities" ADD VALUE 'WHEELCHAIR_ACCESSIBLE';
ALTER TYPE "SpaceAmenities" ADD VALUE 'OUTDOOR_AREA';
ALTER TYPE "SpaceAmenities" ADD VALUE 'TERRACE';
ALTER TYPE "SpaceAmenities" ADD VALUE 'WATER_ACCESS';
ALTER TYPE "SpaceAmenities" ADD VALUE 'SWIMMING';
ALTER TYPE "SpaceAmenities" ADD VALUE 'OUTSIDE_ALCOHOL_ALLOWED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SpaceType" ADD VALUE 'ART_STUDIO';
ALTER TYPE "SpaceType" ADD VALUE 'COMMUNITY_HALL';
ALTER TYPE "SpaceType" ADD VALUE 'CULTURAL_VENUE';
ALTER TYPE "SpaceType" ADD VALUE 'STAGE';
ALTER TYPE "SpaceType" ADD VALUE 'MEETING_ROOM';
ALTER TYPE "SpaceType" ADD VALUE 'COWORKING_SPACE';
ALTER TYPE "SpaceType" ADD VALUE 'CAFE';
ALTER TYPE "SpaceType" ADD VALUE 'WELLNESS_SPACE';
ALTER TYPE "SpaceType" ADD VALUE 'SAUNA';
ALTER TYPE "SpaceType" ADD VALUE 'BATHHOUSE';
ALTER TYPE "SpaceType" ADD VALUE 'PRIVATE_HOME';
ALTER TYPE "SpaceType" ADD VALUE 'LIVING_ROOM';
ALTER TYPE "SpaceType" ADD VALUE 'NATURE_SPACE';
ALTER TYPE "SpaceType" ADD VALUE 'TERRACE';
ALTER TYPE "SpaceType" ADD VALUE 'RETREAT_CENTER';
ALTER TYPE "SpaceType" ADD VALUE 'FARM';
ALTER TYPE "SpaceType" ADD VALUE 'CABIN';
