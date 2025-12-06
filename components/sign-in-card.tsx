"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function SignInCard() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("lastConversationId");
    }
    const result = await signIn("credentials", {
      username,
      password,
      action: mode,
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      setError(result.error);
      setStatus("idle");
      return;
    }
    if (result?.url) {
      window.location.href = result.url;
      return;
    }
    window.location.href = callbackUrl;
  };

  return (
    <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-indigo-100">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-3 py-1 font-semibold transition ${
            mode === "login" ? "bg-white/20 text-white" : "hover:bg-white/10"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-full px-3 py-1 font-semibold transition ${
            mode === "register" ? "bg-white/20 text-white" : "hover:bg-white/10"
          }`}
        >
          Register
        </button>
      </div>
      <h1 className="mt-3 text-2xl font-semibold">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-slate-200/90">
        Use a username and password to {mode === "login" ? "sign in." : "get started."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/40 focus:ring-white/20"
        />
        <input
          type="password"
          required
          value={password}
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/40 focus:ring-white/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Working..." : mode === "login" ? "Login" : "Register & login"}
        </button>
      </form>
      <p className="mt-3 text-xs text-indigo-100/90">
        Admins can sign in with the reserved admin username to manage users and quotas.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-200">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-400">
        Passwords are stored securely and never emailed.
      </p>
    </div>
  );
}
