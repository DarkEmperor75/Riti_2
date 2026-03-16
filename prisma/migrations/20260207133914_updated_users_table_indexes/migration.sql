-- DropIndex
DROP INDEX "users_country_city_language_idx";

-- DropIndex
DROP INDEX "users_email_emailVerified_idx";

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");
