import { NextResponse } from "next/server";
import { getAuthSession, DAILY_RESPONSE_LIMIT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addUTCDays, startOfUTCDay } from "@/lib/dates";

export async function GET() {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const hasIdentity =
    userId ||
    (session?.user as { email?: string } | undefined)?.email ||
    (session?.user as { name?: string } | undefined)?.name;

  if (!hasIdentity || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      dailyLimit: true,
      googleApiKeyCipher: true,
      isAdmin: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = startOfUTCDay();
  const dayEnd = addUTCDays(day, 1);
  const usage = await prisma.dailyUsage.findFirst({
    where: { userId, day: { gte: day, lt: dayEnd } },
    select: { responses: true, sharedResponses: true, personalResponses: true },
  });

  const hasPersonalKey = Boolean(user.googleApiKeyCipher);
  const effectiveLimit = hasPersonalKey ? null : user.dailyLimit ?? DAILY_RESPONSE_LIMIT;
  const usedTotal = usage?.responses ?? 0;

  return NextResponse.json({
    usedTotal,
    usedShared: usage?.sharedResponses ?? 0,
    usedPersonal: usage?.personalResponses ?? 0,
    limit: effectiveLimit,
    remaining:
      typeof effectiveLimit === "number" ? Math.max(effectiveLimit - usedTotal, 0) : null,
    defaultLimit: DAILY_RESPONSE_LIMIT,
    hasPersonalKey,
  });
}
