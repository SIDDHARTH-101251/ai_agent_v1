-- Add per-user quota override and blocking capability
ALTER TABLE "User"
  ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dailyLimit" INTEGER;

-- Backfill existing rows with default values
UPDATE "User" SET "isBlocked" = false WHERE "isBlocked" IS NULL;
