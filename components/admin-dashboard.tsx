"use client";
import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  username: string | null;
  displayName: string;
  image: string | null;
  isAdmin: boolean;
  createdAt: string;
  used: number;
  remaining: number;
};
type UsagePoint = { day: string; responses: number };

type Props = {
  users: UserRow[];
  limit: number;
};

export function AdminDashboard({ users, limit }: Props) {
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? "");
  const [usage, setUsage] = useState<UsagePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState(limit);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/admin/users?userId=${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        setUsage(Array.isArray(data.usage) ? data.usage : []);
        if (typeof data.limit === "number") {
          setQuotaLimit(data.limit);
        }
      })
      .catch(() => setUsage([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  const selectedRemaining = selectedUser
    ? Math.max(quotaLimit - selectedUser.used, 0)
    : quotaLimit;
  const maxResponses = useMemo(
    () => Math.max(quotaLimit, ...usage.map((u) => u.responses), 1),
    [quotaLimit, usage]
  );

  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
          <p className="text-sm text-slate-200">No users found yet.</p>
        </div>
      </div>
    );
  }

  const renderAvatar = (u: UserRow) => (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/40 text-sm">
      {u.image ? (
        <img src={u.image} alt="" className="h-full w-full object-cover" />
      ) : (
        u.displayName[0] ?? "U"
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-indigo-100">Admin</p>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          </div>
          <div className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100">
            Daily quota: {quotaLimit} responses
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">Users</p>
            <p className="mt-2 text-2xl font-semibold">{users.length}</p>
            <p className="text-xs text-slate-300">Registered accounts</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">Used today</p>
            <p className="mt-2 text-2xl font-semibold">
              {selectedUser?.used ?? 0} / {quotaLimit}
            </p>
            <p className="text-xs text-slate-300">Responses consumed by selected user</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">Quota left</p>
            <p className="mt-2 text-2xl font-semibold">{selectedRemaining}</p>
            <p className="text-xs text-slate-300">Remaining for today</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Users</p>
              <p className="text-[11px] text-slate-300">{quotaLimit} responses / day</p>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-auto pr-2">
              {users.map((u) => {
                const usedPct = quotaLimit
                  ? Math.min(100, (u.used / quotaLimit) * 100)
                  : 0;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selectedId === u.id
                        ? "border-emerald-300/50 bg-emerald-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {renderAvatar(u)}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{u.displayName}</p>
                        <p className="text-xs text-slate-300">@{u.username ?? "user"}</p>
                        <div className="mt-2 h-2 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-emerald-400"
                            style={{ width: `${usedPct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300">
                          Used {u.used}/{quotaLimit} · Left {Math.max(quotaLimit - u.used, u.remaining)}
                        </p>
                      </div>
                      {u.isAdmin && (
                        <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100">
                          Admin
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Selected user</p>
              {selectedUser ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    {renderAvatar(selectedUser)}
                    <div className="min-w-0">
                      <p className="text-lg font-semibold">{selectedUser.displayName}</p>
                      <p className="text-xs text-slate-300">@{selectedUser.username ?? "user"}</p>
                      <p className="text-[11px] text-slate-400">
                        Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Quota left</p>
                      <p className="text-xl font-semibold">{selectedRemaining}</p>
                      <p className="text-[11px] text-slate-400">of {quotaLimit} today</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Used today</p>
                      <p className="mt-1 text-lg font-semibold">{selectedUser.used}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Remaining</p>
                      <p className="mt-1 text-lg font-semibold">{selectedRemaining}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Role</p>
                      <p className="mt-1 text-lg font-semibold">{selectedUser.isAdmin ? "Admin" : "User"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-200">Select a user to inspect their quota.</p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Usage (last 7 days)</p>
                <p className="text-[11px] text-slate-300">Limit {quotaLimit}/day</p>
              </div>
              {loading ? (
                <p className="text-sm text-slate-200">Loading…</p>
              ) : usage.length === 0 ? (
                <p className="text-sm text-slate-200">No data</p>
              ) : (
                <div className="space-y-2">
                  {usage.map((d) => {
                    const width = Math.min(100, (d.responses / maxResponses) * 100);
                    const dayLabel = new Date(d.day).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                    return (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className="w-16 text-xs text-slate-200">{dayLabel}</span>
                        <div className="h-2 flex-1 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-emerald-400"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs text-slate-100">{d.responses}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
