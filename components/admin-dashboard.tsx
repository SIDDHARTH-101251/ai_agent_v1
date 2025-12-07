"use client";
import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  username: string | null;
  displayName: string;
  image: string | null;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
  used: number;
  limit: number;
  remaining: number;
  hasGoogleKey: boolean;
};
type UsagePoint = { day: string; responses: number };

type Props = {
  users: UserRow[];
  defaultLimit: number;
};

export function AdminDashboard({ users, defaultLimit }: Props) {
  const [userList, setUserList] = useState(users);
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? "");
  const [usage, setUsage] = useState<UsagePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState(users[0]?.limit ?? defaultLimit);
  const [limitInput, setLimitInput] = useState(String(users[0]?.limit ?? defaultLimit));
  const [blocked, setBlocked] = useState(users[0]?.isBlocked ?? false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
        if (typeof data.hasGoogleKey === "boolean") {
          setUserList((prev) =>
            prev.map((u) =>
              u.id === selectedId ? { ...u, hasGoogleKey: data.hasGoogleKey } : u
            )
          );
        }
      })
      .catch(() => setUsage([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    const selected = userList.find((u) => u.id === selectedId);
    if (selected) {
      const nextLimit = selected.limit ?? defaultLimit;
      setQuotaLimit(nextLimit);
      setLimitInput(String(nextLimit));
      setBlocked(selected.isBlocked);
    }
  }, [selectedId, userList, defaultLimit]);

  const selectedUser = userList.find((u) => u.id === selectedId) ?? null;
  const selectedRemaining = selectedUser
    ? Math.max(quotaLimit - selectedUser.used, 0)
    : quotaLimit;
  const maxResponses = useMemo(
    () => Math.max(quotaLimit, ...usage.map((u) => u.responses), 1),
    [quotaLimit, usage]
  );

  const updateUserSettings = async (updates: { dailyLimit?: number | null; isBlocked?: boolean }) => {
    if (!selectedId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedId, ...updates }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMessage(payload.error ?? "Failed to save");
        return;
      }
      const updated = payload.user as UserRow | undefined;
      if (updated) {
        setUserList((prev) =>
          prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
        );
        setQuotaLimit(updated.limit);
        setLimitInput(String(updated.limit));
        setBlocked(updated.isBlocked);
        setSaveMessage("Saved");
      }
    } catch (err) {
      setSaveMessage("Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  if (userList.length === 0) {
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
            <p className="mt-2 text-2xl font-semibold">{userList.length}</p>
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
              {userList.map((u) => {
                const usedPct = u.limit
                  ? Math.min(100, (u.used / u.limit) * 100)
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
                          Used {u.used}/{u.limit} · Left {Math.max(u.limit - u.used, 0)}
                        </p>
                      </div>
                      {u.isAdmin && (
                        <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100">
                          Admin
                        </span>
                      )}
                      {u.isBlocked && (
                        <span className="rounded-full border border-red-300/40 bg-red-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-100">
                          Blocked
                        </span>
                      )}
                      {u.hasGoogleKey && (
                        <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                          Personal key
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
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Personal key</p>
                      <p className="mt-1 text-lg font-semibold">
                        {selectedUser.hasGoogleKey ? "Active" : "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                      <div className="flex-1">
                        <label className="text-[11px] uppercase tracking-[0.2em] text-slate-300">
                          Daily quota
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={limitInput}
                          onChange={(e) => setLimitInput(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/40 focus:ring-white/20"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">Default: {defaultLimit}</p>
                      </div>
                      <button
                        onClick={() => {
                          const trimmed = limitInput.trim();
                          const parsed = trimmed === "" ? null : Number(trimmed);
                          if (parsed !== null && !Number.isFinite(parsed)) {
                            setSaveMessage("Enter a valid number");
                            return;
                          }
                          updateUserSettings({ dailyLimit: parsed });
                        }}
                        disabled={saving}
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400 disabled:opacity-60 sm:w-auto"
                      >
                        {saving ? "Saving..." : "Save quota"}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-slate-300">
                        Status: {blocked ? "Blocked" : "Active"}
                      </span>
                      <button
                        onClick={() => updateUserSettings({ isBlocked: !blocked })}
                        disabled={saving}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition ${
                          blocked
                            ? "border border-emerald-300/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                            : "border border-red-300/40 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                        } disabled:opacity-60`}
                      >
                        {blocked ? "Unblock user" : "Block user"}
                      </button>
                      {saveMessage && (
                        <span className="text-xs text-slate-200">{saveMessage}</span>
                      )}
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
