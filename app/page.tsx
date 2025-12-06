import Link from "next/link";
import { Chat } from "@/components/chat";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getAuthSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const profileSummary =
    (session?.user as { profileSummary?: string } | undefined)?.profileSummary ??
    null;

  const initialFontScale = (() => {
    if (!profileSummary) return undefined;
    try {
      const parsed = JSON.parse(profileSummary);
      const val = parsed?.fontScale;
      if (typeof val === "number" && val > 0.6 && val < 2.5) {
        return val;
      }
    } catch {
      return undefined;
    }
    return undefined;
  })();

  if (!session || !userId) {
    return (
      <div
        className="relative flex h-screen min-h-screen max-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 px-6 text-white md:h-auto md:max-h-none md:min-h-screen"
        style={{ height: "100vh" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(99,102,241,0.25),transparent_32%)]" />
        <div className="absolute inset-10 rounded-[40px] border border-white/5 bg-white/5 blur-3xl" />
        <div className="relative z-10 w-full max-w-4xl space-y-8 text-center">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.3)]" />
              Live workspace
            </span>
          </div>
          <h1 className="text-5xl font-semibold leading-tight text-white sm:text-6xl">
            AI chat, tuned for focus.
          </h1>
          <p className="text-lg text-slate-200/90">
            Minimal surface, fast streaming, email magic links. Drop straight
            into the chat experience.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Enter workspace
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {[
              { title: "Streaming", detail: "Token-by-token replies" },
              { title: "Threaded", detail: "Saved conversations & pins" },
              { title: "Secure", detail: "Email-only sign in" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-indigo-100">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-slate-200/90">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 15,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      // preload pinned message ids for this user
      _count: {
        select: { messages: true },
      },
    },
  });

  const pinned = await prisma.pinnedMessage.findMany({
    where: { userId },
    select: { messageId: true },
  });

  const initialConversations = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary ?? null,
    createdAt: c.createdAt.toISOString(),
    messages: c.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
  }));

  return (
    <Chat
      userName={session.user?.name ?? session.user?.email}
      initialConversations={initialConversations}
      initialThemeName={
        typeof (session.user as { themeName?: string } | undefined)?.themeName ===
        "string"
          ? ((session.user as { themeName?: string }).themeName as string)
          : undefined
      }
      initialThemeMode={
        typeof (session.user as { themeMode?: string } | undefined)?.themeMode ===
        "string"
          ? ((session.user as { themeMode?: string }).themeMode as string)
          : undefined
      }
      initialPinnedIds={pinned.map((p) => p.messageId)}
      initialFontScale={initialFontScale}
    />
  );
}
