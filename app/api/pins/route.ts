import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user?.email || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const messageId = typeof body?.messageId === "string" ? body.messageId : null;
  const pinned = Boolean(body?.pinned);

  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversation: { userId } },
    select: { id: true },
  });

  if (!message) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ensure idempotency and avoid unique conflicts by deleting then (re)creating.
  await prisma.pinnedMessage.deleteMany({
    where: { messageId, userId },
  });

  if (pinned) {
    await prisma.pinnedMessage.create({
      data: { messageId, userId },
    });
  }

  return NextResponse.json({ ok: true });
}
