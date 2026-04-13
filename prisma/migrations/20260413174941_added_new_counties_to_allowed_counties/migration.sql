-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AllowedCountries" ADD VALUE 'DE';
ALTER TYPE "AllowedCountries" ADD VALUE 'PL';
ALTER TYPE "AllowedCountries" ADD VALUE 'NL';
ALTER TYPE "AllowedCountries" ADD VALUE 'HU';
ALTER TYPE "AllowedCountries" ADD VALUE 'BG';
ALTER TYPE "AllowedCountries" ADD VALUE 'RO';
