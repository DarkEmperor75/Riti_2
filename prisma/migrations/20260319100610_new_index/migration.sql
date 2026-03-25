-- CreateIndex
CREATE INDEX "tickets_eventId_attendeeId_idx" ON "tickets"("eventId", "attendeeId");
