-- DropForeignKey
ALTER TABLE "emails" DROP CONSTRAINT "emails_userId_fkey";

-- AlterTable
ALTER TABLE "emails" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
