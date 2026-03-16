/*
  Warnings:

  - You are about to alter the column `studentDiscount` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "events" ALTER COLUMN "studentDiscount" SET DEFAULT 0,
ALTER COLUMN "studentDiscount" SET DATA TYPE INTEGER;
