-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "checkpoint" JSONB NOT NULL,
    "metadata" JSONB,
    "parentConfig" JSONB,
    "pendingWrites" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Checkpoint_threadId_idx" ON "Checkpoint"("threadId");
