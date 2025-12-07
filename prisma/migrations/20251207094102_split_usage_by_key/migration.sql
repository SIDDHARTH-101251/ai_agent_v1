-- AlterTable
ALTER TABLE "DailyUsage" ADD COLUMN     "personalResponses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sharedResponses" INTEGER NOT NULL DEFAULT 0;
