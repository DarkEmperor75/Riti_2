-- DropIndex
DROP INDEX "tickets_attendeeId_eventId_key";

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_paymentAttemptCount_paymentStatus_paymentExpiresAt_idx" ON "tickets"("paymentAttemptCount", "paymentStatus", "paymentExpiresAt");
