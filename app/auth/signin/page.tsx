import Link from "next/link";
import { SignInCard } from "@/components/sign-in-card";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div
      className="relative flex h-screen min-h-screen max-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 px-6 py-12 text-white md:h-auto md:max-h-none md:min-h-screen"
      style={{ height: "100vh" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.18),transparent_30%)]" />
      <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6">
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-semibold leading-tight text-white">
                Login or Register
              </h1>
              <p className="text-sm text-slate-200/90">
                Use a username and password to sign in. New users can register below.
              </p>
            </div>
            <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-slate-200/80">Loading...</div>}>
              <SignInCard />
            </Suspense>
            <Link
              href="/"
              className="mx-auto inline-flex items-center gap-2 text-xs font-semibold text-indigo-100 underline underline-offset-4 transition hover:text-white"
            >
              Back to landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
