/*
  Warnings:

  - The `country` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `initialIntent` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `language` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ATTENDEE', 'HOST', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'NO');

-- CreateEnum
CREATE TYPE "InitialIntent" AS ENUM ('ATTEND', 'HOST', 'LIST_SPACE');

-- CreateEnum
CREATE TYPE "AllowedCountries" AS ENUM ('NO', 'SE', 'DK');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EMAIL_VERIFIED';

-- AlterTable
ALTER TABLE "attendees" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "profilePhoto" TEXT;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'ATTENDEE',
DROP COLUMN "country",
ADD COLUMN     "country" "AllowedCountries" NOT NULL DEFAULT 'NO',
DROP COLUMN "initialIntent",
ADD COLUMN     "initialIntent" "InitialIntent" NOT NULL DEFAULT 'ATTEND',
DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'EN';

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_application" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "tempFields" JSONB,

    CONSTRAINT "vendor_application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_isRevoked_idx" ON "refresh_tokens"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_application_vendorId_key" ON "vendor_application"("vendorId");

-- CreateIndex
CREATE INDEX "sessions_userId_isRevoked_idx" ON "sessions"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "users_email_emailVerified_idx" ON "users"("email", "emailVerified");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_country_language_idx" ON "users"("country", "language");

-- CreateIndex
CREATE INDEX "users_userType_idx" ON "users"("userType");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_application" ADD CONSTRAINT "vendor_application_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
