-- AlterTable
ALTER TABLE "payouts" ALTER COLUMN "actorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
