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
  const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : undefined;
  const fontScale =
    typeof fontScaleRaw === "number" && fontScaleRaw > 0.6 && fontScaleRaw < 2.5
      ? fontScaleRaw
      : undefined;

  if (!themeName && !themeMode && !fontScale && !imageDataUrl) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  let existingPrefs: Record<string, unknown> = {};
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileSummary: true },
  });
  if (user?.profileSummary) {
    try {
      const parsed = JSON.parse(user.profileSummary);
      if (parsed && typeof parsed === "object") {
        existingPrefs = parsed as Record<string, unknown>;
      }
    } catch {
      // ignore invalid legacy profileSummary values
      existingPrefs = {};
    }
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
      ...(imageDataUrl ? { image: imageDataUrl } : {}),
      ...(fontScale !== undefined ? { profileSummary: JSON.stringify(mergedPrefs) } : {}),
    },
    select: { themeName: true, themeMode: true, profileSummary: true, image: true },
  });

  return NextResponse.json(updated);
}
