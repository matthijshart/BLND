"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User, Strike } from "@/types";
import { activeStrikes, removeStrike, unbanUser } from "@/lib/strikes";

/**
 * Admin review console for the BLEND etiquette system.
 *
 * Three sections, in order of urgency:
 *  1. Banned users — manual unban available
 *  2. Users with active strikes (within window) — approaching the limit
 *  3. Recent incidents — chronological audit log
 *
 * No automated email is sent on unban; do that manually for now.
 */
type UserWithUid = User;

export default function AdminStrikesPage() {
  const [users, setUsers] = useState<UserWithUid[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    // Pull every user. At <10k this is fine — see lib/admin/metrics.ts.
    const snap = await getDocs(collection(db, "users"));
    const all = snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserWithUid[];
    setUsers(all);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Banned but recoverable via admin
  const banned = users.filter((u) => u.bannedAt);
  // Has any active strikes (within window) but not banned
  const withActive = users.filter((u) => !u.bannedAt && activeStrikes(u).length > 0);
  // All recent incidents flat — for the audit log
  const allIncidents = users
    .flatMap((u) =>
      (u.strikes || []).map((s) => ({ user: u, strike: s }))
    )
    .sort((a, b) => (b.strike.createdAt?.toMillis?.() ?? 0) - (a.strike.createdAt?.toMillis?.() ?? 0))
    .slice(0, 30);

  async function handleUnban(uid: string) {
    setBusy(uid);
    try {
      await unbanUser(uid);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function handleRemoveStrike(uid: string, s: Strike) {
    setBusy(`${uid}-${s.dateId}`);
    try {
      await removeStrike(uid, s.dateId, s.type);
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/admin/metrics" className="text-[10px] font-mono uppercase tracking-[0.3em] text-wine">
        ← Metrics
      </Link>
      <h1 className="text-4xl font-display text-ink mt-2">Strikes review</h1>
      <p className="text-ink-mid text-sm mt-1">
        Anti-flake enforcement. Be careful with unbans — they&apos;re a trust signal.
      </p>

      {loading ? (
        <p className="text-gray-light text-sm mt-10">Loading…</p>
      ) : (
        <>
          {/* Banned */}
          <Section title="Banned users" subtitle="Currently locked out. Unban only with strong reason.">
            {banned.length === 0 ? (
              <Empty>No banned users.</Empty>
            ) : (
              <div className="space-y-3">
                {banned.map((u) => (
                  <Card key={u.uid}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-ink">{u.displayName}, {u.age}</p>
                        <p className="text-gray-light text-xs font-mono">{u.uid.slice(0, 12)}…</p>
                        <p className="text-coral text-xs mt-1">
                          Banned for: {u.banReason || "manual"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnban(u.uid)}
                        disabled={busy === u.uid}
                        className="text-xs px-3 py-1.5 rounded-full border border-wine/30 text-wine hover:bg-wine/5 disabled:opacity-50"
                      >
                        {busy === u.uid ? "…" : "Unban"}
                      </button>
                    </div>
                    {u.strikes && u.strikes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stripe-white space-y-1.5">
                        {u.strikes.map((s, i) => (
                          <StrikeLine key={i} strike={s} />
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Section>

          {/* Approaching */}
          <Section
            title="Users with active strikes"
            subtitle="Within the 60-day window. Not banned yet."
          >
            {withActive.length === 0 ? (
              <Empty>Everyone&apos;s clean.</Empty>
            ) : (
              <div className="space-y-3">
                {withActive.map((u) => {
                  const active = activeStrikes(u);
                  return (
                    <Card key={u.uid}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-ink">{u.displayName}, {u.age}</p>
                          <p className="text-gray-light text-xs font-mono">{u.uid.slice(0, 12)}…</p>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-wine bg-wine/10 px-2 py-1 rounded-full">
                          {active.length} active
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stripe-white space-y-2">
                        {active.map((s, i) => (
                          <div key={i} className="flex items-center justify-between gap-3">
                            <StrikeLine strike={s} />
                            <button
                              onClick={() => handleRemoveStrike(u.uid, s)}
                              disabled={busy === `${u.uid}-${s.dateId}`}
                              className="text-[11px] text-gray hover:text-wine"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Audit log */}
          <Section title="Recent incidents" subtitle="Last 30 strikes across all users.">
            {allIncidents.length === 0 ? (
              <Empty>No strikes logged yet.</Empty>
            ) : (
              <Card>
                <div className="space-y-2.5">
                  {allIncidents.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-ink truncate">{entry.user.displayName}</p>
                        <StrikeLine strike={entry.strike} compact />
                      </div>
                      <span className="text-gray-light text-xs shrink-0">
                        {formatRelative(entry.strike.createdAt?.toMillis?.() ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

// ── small components ──────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-display text-ink">{title}</h2>
      {subtitle && <p className="text-gray text-sm mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl shadow-sm p-4">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <Card><p className="text-gray-light text-sm">{children}</p></Card>;
}

function StrikeLine({ strike, compact }: { strike: Strike; compact?: boolean }) {
  const label =
    strike.type === "no_show"
      ? "No-show"
      : `Cancellation · ${strike.timing?.replace("_", "-") ?? "unknown"}`;
  const reason = strike.reason ? ` · ${strike.reason}` : "";
  return (
    <p className={`text-gray ${compact ? "text-[11px]" : "text-xs"}`}>
      {label}{reason}
    </p>
  );
}

function formatRelative(ms: number): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const d = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}
