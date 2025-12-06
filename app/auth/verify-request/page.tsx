export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 px-6 text-white">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
          Check your inbox
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          We sent a magic link to your email.
        </h1>
        <p className="mt-3 text-slate-200">
          Click the link to finish signing in. Keep this tab open — it will
          refresh after authentication.
        </p>
      </div>
    </div>
  );
}
