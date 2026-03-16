-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_AUTO_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_SENT';
ALTER TYPE "NotificationType" ADD VALUE 'STRIPE_CONNECTION_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_BOOKING_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'SPACE_SUSPENDED';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_NOTICE';
ALTER TYPE "NotificationType" ADD VALUE 'ONBOARDING_REMINDER';

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_createdAt_idx" ON "notification"("createdAt");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
