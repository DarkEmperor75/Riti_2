/*
  Warnings:

  - You are about to drop the column `city` on the `attendees` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `hosts` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `vendors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendees" DROP COLUMN "city";

-- AlterTable
ALTER TABLE "hosts" DROP COLUMN "city";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "city" TEXT;

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "city";

-- CreateIndex
CREATE INDEX "users_isAdmin_idx" ON "users"("isAdmin");
