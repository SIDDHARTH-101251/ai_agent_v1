import { redirect } from "next/navigation";
import { getAuthSession, DAILY_RESPONSE_LIMIT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin-dashboard";
import { addUTCDays, startOfUTCDay } from "@/lib/dates";

export default async function AdminPage() {
  const session = await getAuthSession();
  if (!(session?.user as { isAdmin?: boolean })?.isAdmin) {
    redirect("/auth/signin");
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
      displayName: u.name ?? u.username ?? "User",
      image: u.image ?? null,
      isAdmin: u.isAdmin,
      isBlocked: u.isBlocked,
      limit: effectiveLimit,
      createdAt: u.createdAt.toISOString(),
      used,
      remaining: Math.max(effectiveLimit - used, 0),
    };
  });

  return <AdminDashboard users={mapped} defaultLimit={DAILY_RESPONSE_LIMIT} />;
}
