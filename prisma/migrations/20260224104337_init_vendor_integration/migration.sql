/*
  Warnings:

  - You are about to drop the column `stripeOnboarded` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `stripeVerified` on the `vendors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "stripeOnboarded",
DROP COLUMN "stripeVerified",
ADD COLUMN     "stripeAccountCountry" "AllowedCountries",
ADD COLUMN     "stripeAccountCreatedAt" TIMESTAMP(3),
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDisabledReason" TEXT,
ADD COLUMN     "stripeOnboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "vendors_stripeAccountId_stripeAccountCountry_stripePayoutsE_idx" ON "vendors"("stripeAccountId", "stripeAccountCountry", "stripePayoutsEnabled");

-- CreateIndex
CREATE INDEX "vendors_stripeOnboardingCompletedAt_idx" ON "vendors"("stripeOnboardingCompletedAt");
