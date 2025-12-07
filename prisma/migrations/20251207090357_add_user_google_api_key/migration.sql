-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleApiKeyCipher" TEXT,
ADD COLUMN     "googleApiKeySetAt" TIMESTAMP(3);
