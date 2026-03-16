/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('WELCOME', 'FORGOT_PASSWORD', 'BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION', 'EVENT_REMINDER', 'EVVENT_REFUND_CONFIRMATION', 'EVENT_CANCELLATION', 'SPACE_REFUND_CONFIRMATION', 'EVENT_PAYOUT', 'SPACE_BOOKING_CONFIRMED', 'SPACE_BOOKING_CANCELLED', 'SPACE_BOOKING_PAYOUT');

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_userId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- DropTable
DROP TABLE "notification";

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "to" TEXT[],
    "subject" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "emails_userId_idx" ON "emails"("userId");

-- CreateIndex
CREATE INDEX "emails_status_idx" ON "emails"("status");

-- CreateIndex
CREATE INDEX "emails_createdAt_idx" ON "emails"("createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
