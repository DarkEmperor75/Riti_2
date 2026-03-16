-- CreateTable
CREATE TABLE "days_blocked" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "startingDate" TIMESTAMP(3) NOT NULL,
    "endingDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "days_blocked_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "days_blocked_spaceId_startingDate_endingDate_idx" ON "days_blocked"("spaceId", "startingDate", "endingDate");

-- AddForeignKey
ALTER TABLE "days_blocked" ADD CONSTRAINT "days_blocked_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
