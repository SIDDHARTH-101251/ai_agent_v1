/*
  Warnings:

  - A unique constraint covering the columns `[userId,messageId]` on the table `PinnedMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PinnedMessage_messageId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PinnedMessage_userId_messageId_key" ON "PinnedMessage"("userId", "messageId");
