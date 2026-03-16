/*
  Warnings:

  - Made the column `userId` on table `emails` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "emails" ALTER COLUMN "userId" SET NOT NULL;
