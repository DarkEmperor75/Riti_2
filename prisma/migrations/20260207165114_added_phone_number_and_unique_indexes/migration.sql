/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber]` on the table `attendees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `hosts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "attendees" ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "attendees_phoneNumber_key" ON "attendees"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hosts_phoneNumber_key" ON "hosts"("phoneNumber");
