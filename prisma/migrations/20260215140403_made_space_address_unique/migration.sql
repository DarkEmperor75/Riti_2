/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `spaces` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "spaces_address_key" ON "spaces"("address");
