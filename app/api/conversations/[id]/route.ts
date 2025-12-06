import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

type RouteParams =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: RouteParams) {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user?.email || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await Promise.resolve(context.params);
  const conversationId = resolved?.id;

  if (!conversationId) {
    return NextResponse.json(
      { error: "Conversation id missing" },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { user: true },
  });

  if (!conversation || conversation.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.message.deleteMany({ where: { conversationId } });
  await prisma.conversation.delete({ where: { id: conversationId } });

  return NextResponse.json({ ok: true });
}
