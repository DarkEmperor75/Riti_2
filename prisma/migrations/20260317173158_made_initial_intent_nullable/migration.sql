-- AlterTable
ALTER TABLE "users" ALTER COLUMN "initialIntent" DROP NOT NULL,
ALTER COLUMN "initialIntent" DROP DEFAULT;
