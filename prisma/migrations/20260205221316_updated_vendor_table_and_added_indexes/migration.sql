-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "isOnBoarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "hosts_id_idx" ON "hosts"("id");

-- CreateIndex
CREATE INDEX "vendors_isOnBoarded_idx" ON "vendors"("isOnBoarded");

-- CreateIndex
CREATE INDEX "vendors_vendorStatus_idx" ON "vendors"("vendorStatus");

-- CreateIndex
CREATE INDEX "vendors_userId_id_idx" ON "vendors"("userId", "id");
