/*
  Warnings:

  - A unique constraint covering the columns `[location]` on the table `spaces` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "location" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "spaces_location_key" ON "spaces"("location");
