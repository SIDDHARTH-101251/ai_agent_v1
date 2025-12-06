import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

type RouteParams =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export async function DELETE(
  _req: Request,
  context: RouteParams
) {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const hasIdentity =
    userId ||
    (session?.user as { email?: string } | undefined)?.email ||
    (session?.user as { name?: string } | undefined)?.name;

  if (!hasIdentity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await Promise.resolve(context.params);
  const messageId = resolved?.id;

  if (!messageId) {
    return NextResponse.json({ error: "Message id missing" }, { status: 400 });
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (!message || message.conversation.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.message.delete({ where: { id: messageId } });

  return NextResponse.json({ ok: true });
}
