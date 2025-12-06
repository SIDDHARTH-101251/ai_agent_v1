import {
  BaseCheckpointSaver,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointTuple,
  type PendingWrite,
} from "@langchain/langgraph-checkpoint";
import type { RunnableConfig } from "@langchain/core/runnables";
import { prisma } from "./prisma";

function safeJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "function" ? undefined : v))
  );
}

function getThreadId(config: RunnableConfig): string | undefined {
  const fromConfig = (config as { configurable?: { thread_id?: string } })
    ?.configurable?.thread_id;
  if (typeof fromConfig === "string" && fromConfig.length > 0) return fromConfig;
  // Fallback to runName if provided.
  const runName = (config as { runName?: string | undefined })?.runName;
  if (typeof runName === "string" && runName.length > 0) return runName;
  return undefined;
}

export class PrismaCheckpointSaver extends BaseCheckpointSaver {
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = getThreadId(config);
    if (!threadId) return undefined;

    const row = await prisma.checkpoint.findFirst({
      where: { threadId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return undefined;

    const storedPending = row.pendingWrites as unknown;
    const pending = Array.isArray(storedPending)
      ? (storedPending as unknown as PendingWrite[])
      : [];

    return {
      config: row.config as unknown as RunnableConfig,
      checkpoint: row.checkpoint as unknown as Checkpoint,
      metadata: row.metadata as unknown as CheckpointMetadata | undefined,
      parentConfig: row.parentConfig as unknown as RunnableConfig | undefined,
      pendingWrites: pending as unknown as [string, string, unknown][],
    };
  }

  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = getThreadId(config);
    if (!threadId) return;
    const take = options?.limit ?? 20;

    const rows = await prisma.checkpoint.findMany({
      where: { threadId },
      orderBy: { createdAt: "desc" },
      take,
    });

    for (const row of rows) {
      const storedPending = row.pendingWrites as unknown;
      const pending = Array.isArray(storedPending)
        ? (storedPending as unknown as PendingWrite[])
        : [];
      yield {
        config: row.config as unknown as RunnableConfig,
        checkpoint: row.checkpoint as unknown as Checkpoint,
        metadata: row.metadata as unknown as CheckpointMetadata | undefined,
        parentConfig: row.parentConfig as unknown as RunnableConfig | undefined,
        pendingWrites: pending as unknown as [string, string, unknown][],
      };
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    _newVersions: Record<string, number | string>
  ): Promise<RunnableConfig> {
    const threadId = getThreadId(config);
    if (!threadId) {
      throw new Error("thread_id missing in config for checkpoint");
    }

    await prisma.checkpoint.create({
      data: {
        threadId,
        config: safeJson(config) as unknown as object,
        checkpoint: safeJson(checkpoint) as unknown as object,
        metadata: safeJson(metadata) as unknown as object,
      },
    });

    return config;
  }

  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    _taskId: string
  ): Promise<void> {
    const threadId = getThreadId(config);
    if (!threadId) return;

    const latest = await prisma.checkpoint.findFirst({
      where: { threadId },
      orderBy: { createdAt: "desc" },
      select: { id: true, pendingWrites: true },
    });

    if (!latest) return;

    const storedPending = latest.pendingWrites as unknown;
    const existing = Array.isArray(storedPending)
      ? (storedPending as unknown as PendingWrite[])
      : [];
    await prisma.checkpoint.update({
      where: { id: latest.id },
      data: {
        pendingWrites: safeJson([...existing, ...writes]) as unknown as object,
      },
    });
  }

  async deleteThread(threadId: string): Promise<void> {
    await prisma.checkpoint.deleteMany({ where: { threadId } });
  }
}

export const prismaCheckpointSaver = new PrismaCheckpointSaver();
