/*
  Warnings:

  - You are about to drop the column `stripeOnboarded` on the `hosts` table. All the data in the column will be lost.
  - You are about to drop the column `stripeVerified` on the `hosts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hosts" DROP COLUMN "stripeOnboarded",
DROP COLUMN "stripeVerified",
ADD COLUMN     "stripeAccountCountry" "AllowedCountries",
ADD COLUMN     "stripeAccountCreatedAt" TIMESTAMP(3),
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDisabledReason" TEXT,
ADD COLUMN     "stripeOnboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;
