-- DropForeignKey
ALTER TABLE "emails" DROP CONSTRAINT "emails_userId_fkey";

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
