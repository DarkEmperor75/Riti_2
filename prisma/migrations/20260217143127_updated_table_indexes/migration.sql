-- DropIndex
DROP INDEX "hosts_id_idx";

-- DropIndex
DROP INDEX "vendors_userId_id_idx";

-- CreateIndex
CREATE INDEX "attendees_userId_idx" ON "attendees"("userId");

-- CreateIndex
CREATE INDEX "bookings_renterId_idx" ON "bookings"("renterId");

-- CreateIndex
CREATE INDEX "bookings_spaceId_idx" ON "bookings"("spaceId");

-- CreateIndex
CREATE INDEX "hosts_userId_idx" ON "hosts"("userId");

-- CreateIndex
CREATE INDEX "space_images_spaceId_idx" ON "space_images"("spaceId");

-- CreateIndex
CREATE INDEX "space_pdf_spaceId_idx" ON "space_pdf"("spaceId");

-- CreateIndex
CREATE INDEX "spaces_status_idx" ON "spaces"("status");

-- CreateIndex
CREATE INDEX "spaces_vendorId_idx" ON "spaces"("vendorId");

-- CreateIndex
CREATE INDEX "tickets_eventId_idx" ON "tickets"("eventId");

-- CreateIndex
CREATE INDEX "vendors_userId_idx" ON "vendors"("userId");
