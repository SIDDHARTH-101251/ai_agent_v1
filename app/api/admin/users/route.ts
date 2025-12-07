import { NextResponse, type NextRequest } from "next/server";
import { getAuthSession, DAILY_RESPONSE_LIMIT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addUTCDays, recentUTCDays, startOfUTCDay } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (userId) {
    const today = startOfUTCDay();
    const tomorrow = addUTCDays(today, 1);
    const days = recentUTCDays(7, today);
    const start = days[0];
    const usageRows = await prisma.dailyUsage.findMany({
      where: { userId, day: { gte: start, lt: tomorrow } },
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { dailyLimit: true },
    });
    const effectiveLimit = user?.dailyLimit ?? DAILY_RESPONSE_LIMIT;

    return NextResponse.json({ usage, limit: effectiveLimit, defaultLimit: DAILY_RESPONSE_LIMIT });
  }

  const today = startOfUTCDay();
  const tomorrow = addUTCDays(today, 1);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      isAdmin: true,
      isBlocked: true,
      dailyLimit: true,
      createdAt: true,
      usage: { where: { day: { gte: today, lt: tomorrow } }, select: { responses: true } },
    },
  });

  const mapped = users.map((u) => {
    const used = u.usage[0]?.responses ?? 0;
    const effectiveLimit = u.dailyLimit ?? DAILY_RESPONSE_LIMIT;
    return {
      id: u.id,
      username: u.username ?? "",
      name: u.name ?? u.username ?? "User",
      image: u.image ?? null,
      isAdmin: u.isAdmin,
      isBlocked: u.isBlocked,
      limit: effectiveLimit,
      createdAt: u.createdAt,
      used,
      remaining: Math.max(effectiveLimit - used, 0),
    };
  });

  return NextResponse.json({ users: mapped, limit: DAILY_RESPONSE_LIMIT });
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthSession();
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = (body?.userId as string | undefined)?.trim();
  const dailyLimitRaw = body?.dailyLimit as number | null | undefined;
  const isBlockedRaw = body?.isBlocked as boolean | undefined;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const data: { dailyLimit?: number | null; isBlocked?: boolean } = {};

  if (dailyLimitRaw !== undefined) {
    if (dailyLimitRaw === null) {
      data.dailyLimit = null;
    } else if (typeof dailyLimitRaw === "number" && Number.isFinite(dailyLimitRaw) && dailyLimitRaw > 0 && dailyLimitRaw <= 10000) {
      data.dailyLimit = Math.floor(dailyLimitRaw);
    } else {
      return NextResponse.json({ error: "dailyLimit must be a positive number up to 10000" }, { status: 400 });
    }
  }

  if (isBlockedRaw !== undefined) {
    data.isBlocked = Boolean(isBlockedRaw);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        isAdmin: true,
        isBlocked: true,
        dailyLimit: true,
        createdAt: true,
        usage: {
          where: {
            day: { gte: startOfUTCDay(), lt: addUTCDays(startOfUTCDay(), 1) },
          },
          select: { responses: true },
        },
      },
    });

    const used = updated.usage[0]?.responses ?? 0;
    const effectiveLimit = updated.dailyLimit ?? DAILY_RESPONSE_LIMIT;

    return NextResponse.json({
      user: {
        id: updated.id,
        username: updated.username ?? "",
        name: updated.name ?? updated.username ?? "User",
        displayName: updated.name ?? updated.username ?? "User",
        image: updated.image ?? null,
        isAdmin: updated.isAdmin,
        isBlocked: updated.isBlocked,
        limit: effectiveLimit,
        createdAt: updated.createdAt,
        used,
        remaining: Math.max(effectiveLimit - used, 0),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
