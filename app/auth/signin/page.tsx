import Link from "next/link";
import { SignInCard } from "@/components/sign-in-card";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_30%)]" />
      <div className="absolute inset-8 rounded-[36px] border border-white/5 bg-white/5 blur-3xl" />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.3)]" />
                Welcome back
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold leading-tight text-white">
                  Sign in to your workspace
                </h1>
                <p className="text-slate-200/90">
                  One email, one magic link. No extra friction.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  Email auth
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  Instant access
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  Secure by default
                </span>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-100 underline underline-offset-4 transition hover:text-white"
              >
                Back to landing
              </Link>
            </div>
            <Suspense fallback={<div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-200/80">Loading...</div>}>
              <SignInCard />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
