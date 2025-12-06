"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function SignInCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      setError(result.error);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.25em] text-indigo-100">
        Magic link
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Email sign in</h1>
      <p className="mt-2 text-sm text-slate-200/90">
        Drop your email and we&apos;ll send a one-time link.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/40 focus:ring-white/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "sent"
            ? "Check your email"
            : status === "loading"
            ? "Sending..."
            : "Send magic link"}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-red-200">
          {error}. Ensure SMTP env vars are set.
        </p>
      )}
      <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-400">
        Links expire after a few minutes
      </p>
    </div>
  );
}
