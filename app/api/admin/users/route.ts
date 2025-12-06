import { NextResponse, type NextRequest } from "next/server";
import { getAuthSession, DAILY_RESPONSE_LIMIT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recentUTCDays, startOfUTCDay } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (userId) {
    const today = startOfUTCDay();
    const days = recentUTCDays(7, today);
    const start = days[0];
    const usageRows = await prisma.dailyUsage.findMany({
      where: { userId, day: { gte: start, lte: today } },
      orderBy: { day: "asc" },
      select: { day: true, responses: true },
    });

    const usageLookup = new Map(
      usageRows.map((row) => [startOfUTCDay(row.day).toISOString(), row.responses])
    );

    const usage = days.map((day) => ({
      day: day.toISOString(),
      responses: usageLookup.get(day.toISOString()) ?? 0,
    }));

    return NextResponse.json({ usage, limit: DAILY_RESPONSE_LIMIT });
  }

  const today = startOfUTCDay();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      isAdmin: true,
      createdAt: true,
      usage: { where: { day: today }, select: { responses: true } },
    },
  });

  const mapped = users.map((u) => {
    const used = u.usage[0]?.responses ?? 0;
    return {
      id: u.id,
      username: u.username ?? "",
      name: u.name ?? u.username ?? "User",
      image: u.image ?? null,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      used,
      remaining: Math.max(DAILY_RESPONSE_LIMIT - used, 0),
    };
  });

  return NextResponse.json({ users: mapped, limit: DAILY_RESPONSE_LIMIT });
}
