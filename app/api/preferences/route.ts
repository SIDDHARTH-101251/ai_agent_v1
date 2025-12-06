import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const hasIdentity =
    userId ||
    (session?.user as { email?: string } | undefined)?.email ||
    (session?.user as { name?: string } | undefined)?.name;

  if (!hasIdentity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const themeName = typeof body?.themeName === "string" ? body.themeName : undefined;
  const themeMode = typeof body?.themeMode === "string" ? body.themeMode : undefined;
  const fontScaleRaw = body?.fontScale;
  const fontScale =
    typeof fontScaleRaw === "number" && fontScaleRaw > 0.6 && fontScaleRaw < 2.5
      ? fontScaleRaw
      : undefined;

  if (!themeName && !themeMode && !fontScale) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  let existingPrefs: Record<string, unknown> = {};
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileSummary: true },
    });
    if (user?.profileSummary) {
      const parsed = JSON.parse(user.profileSummary);
      if (parsed && typeof parsed === "object") {
        existingPrefs = parsed as Record<string, unknown>;
      }
    }
  } catch (err) {
    console.error("prefs-read", err);
  }

  const mergedPrefs =
    fontScale !== undefined
      ? { ...existingPrefs, fontScale }
      : existingPrefs;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(themeName ? { themeName } : {}),
      ...(themeMode ? { themeMode } : {}),
      ...(fontScale !== undefined ? { profileSummary: JSON.stringify(mergedPrefs) } : {}),
    },
    select: { themeName: true, themeMode: true, profileSummary: true },
  });

  return NextResponse.json(updated);
}
