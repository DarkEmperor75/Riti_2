/*
  Warnings:

  - You are about to drop the column `profilePhoto` on the `attendees` table. All the data in the column will be lost.
  - You are about to drop the column `profilePhoto` on the `hosts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_country_language_idx";

-- AlterTable
ALTER TABLE "attendees" DROP COLUMN "profilePhoto";

-- AlterTable
ALTER TABLE "hosts" DROP COLUMN "profilePhoto";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profilePicture" TEXT;

-- CreateIndex
CREATE INDEX "users_country_city_language_idx" ON "users"("country", "city", "language");
