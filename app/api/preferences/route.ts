import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session?.user?.email || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const themeName = typeof body?.themeName === "string" ? body.themeName : undefined;
  const themeMode = typeof body?.themeMode === "string" ? body.themeMode : undefined;

  if (!themeName && !themeMode) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(themeName ? { themeName } : {}),
      ...(themeMode ? { themeMode } : {}),
    },
    select: { themeName: true, themeMode: true },
  });

  return NextResponse.json(updated);
}
