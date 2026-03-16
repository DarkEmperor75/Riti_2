/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `users` table. All the data in the column will be lost.
  - Added the required column `phoneNumber` to the `hosts` table without a default value. This is not possible if the table is not empty.
  - Made the column `bio` on table `hosts` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `contactEmail` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ALTER COLUMN "bio" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phoneNumber";

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "businessPfp" TEXT,
ADD COLUMN     "contactEmail" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "hosts_hostingStatus_idx" ON "hosts"("hostingStatus");
