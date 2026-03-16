-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
