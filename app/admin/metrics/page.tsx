"use client";

import { useEffect, useState } from "react";
import { computeMetrics, BENCHMARKS, type Metrics, type CohortRow } from "@/lib/admin/metrics";
import Link from "next/link";

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await computeMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Header onRefresh={refresh} generatedAt={null} loading />
        <div className="mt-12 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-stripe-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Header onRefresh={refresh} generatedAt={null} />
        <div className="mt-12 rounded-2xl bg-red/5 border border-red/20 p-6">
          <p className="text-red font-medium">Failed to load metrics</p>
          <p className="text-ink-mid text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Header onRefresh={refresh} generatedAt={metrics.generatedAt} loading={loading} />

      {/* Hero metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        <HeroStat label="Total users" value={metrics.totalUsers} sublabel={`+${metrics.signups7d} this week`} />
        <HeroStat label="Daily active" value={metrics.dau} sublabel={`${pct(metrics.totalUsers > 0 ? metrics.dau / metrics.totalUsers : 0)} of total`} />
        <HeroStat label="Active blends" value={metrics.activeBlends} sublabel="Scheduling or upcoming" />
        <HeroStat
          label="Verified"
          value={`${metrics.verifiedPct.toFixed(0)}%`}
          sublabel={`${metrics.pendingVerifications} pending review`}
          accent={metrics.pendingVerifications > 0 ? "wine" : undefined}
        />
      </div>

      {/* Engagement */}
      <Section title="Engagement" subtitle="The Match Group analyst's first question">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Label>DAU / WAU / MAU</Label>
            <div className="flex items-baseline gap-3 mt-2">
              <Big>{metrics.dau}</Big>
              <span className="text-gray-light">/</span>
              <Big>{metrics.wau}</Big>
              <span className="text-gray-light">/</span>
              <Big>{metrics.mau}</Big>
            </div>
          </Card>
          <Card>
            <Label>Stickiness (DAU/MAU)</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <Big>{metrics.stickiness.toFixed(1)}%</Big>
              <Bench value={metrics.stickiness} bm={BENCHMARKS.stickiness} />
            </div>
            <p className="text-gray-light text-xs mt-1">{BENCHMARKS.stickiness.source}</p>
          </Card>
          <Card>
            <Label>Today&apos;s activity</Label>
            <div className="mt-3 space-y-1 text-sm">
              <Row left="Likes" right={metrics.likesToday} />
              <Row left="Passes" right={metrics.passesToday} />
              <Row left="New blends" right={metrics.blendsToday} />
            </div>
          </Card>
        </div>
      </Section>

      {/* Cohort retention — the metric M&A analysts open first */}
      <Section
        title="Weekly cohort retention"
        subtitle="The metric Match Group's M&A team opens first. Newer cohorts should outperform older ones."
      >
        <CohortTable cohorts={metrics.cohorts} />
      </Section>

      {/* Conversion funnel */}
      <Section title="Conversion funnel" subtitle="Where users drop off">
        <Card>
          <FunnelRow label="Signed up" count={metrics.funnel.signedUp} total={metrics.funnel.signedUp} />
          <FunnelRow label="Onboarded (photo + bio)" count={metrics.funnel.onboarded} total={metrics.funnel.signedUp} />
          <FunnelRow label="First like" count={metrics.funnel.firstLike} total={metrics.funnel.onboarded} />
          <FunnelRow label="First blend (mutual)" count={metrics.funnel.firstBlend} total={metrics.funnel.firstLike} />
          <FunnelRow label="Meet planned" count={metrics.funnel.meetPlanned} total={metrics.funnel.firstBlend} />
          <FunnelRow label="Meet completed" count={metrics.funnel.meetCompleted} total={metrics.funnel.meetPlanned} />
          <FunnelRow label="Second cup ☕☕" count={metrics.funnel.secondCup} total={metrics.funnel.meetCompleted} accent />
        </Card>
      </Section>

      {/* Quality */}
      <Section title="Quality signals" subtitle="What makes BLEND defensible">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Label>Meet completion rate</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <Big>{metrics.meetCompletionRate.toFixed(0)}%</Big>
              <Bench value={metrics.meetCompletionRate} bm={BENCHMARKS.meetCompletionRate} />
            </div>
            <p className="text-gray-light text-xs mt-1">{BENCHMARKS.meetCompletionRate.source}</p>
          </Card>
          <Card>
            <Label>Second cup rate</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <Big>{metrics.secondCupRate.toFixed(0)}%</Big>
              <Bench value={metrics.secondCupRate} bm={BENCHMARKS.secondCupRate} />
            </div>
            <p className="text-gray-light text-xs mt-1">{BENCHMARKS.secondCupRate.source}</p>
          </Card>
          <Card>
            <Label>Verified profiles</Label>
            <div className="mt-2 flex items-baseline gap-2">
              <Big>{metrics.verifiedPct.toFixed(0)}%</Big>
              <Bench value={metrics.verifiedPct} bm={BENCHMARKS.verifiedPct} />
            </div>
            <p className="text-gray-light text-xs mt-1">{BENCHMARKS.verifiedPct.source}</p>
          </Card>
        </div>
      </Section>

      {/* Growth */}
      <Section title="Growth" subtitle="Top-of-funnel + waitlist">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <Label>Waitlist</Label>
            <Big>{metrics.waitlistCount}</Big>
          </Card>
          <Card>
            <Label>Signups today</Label>
            <Big>{metrics.signupsToday}</Big>
          </Card>
          <Card>
            <Label>Signups 7 days</Label>
            <Big>{metrics.signups7d}</Big>
          </Card>
          <Card>
            <Label>Signups 30 days</Label>
            <Big>{metrics.signups30d}</Big>
          </Card>
        </div>
      </Section>

      {/* Demographics */}
      <Section title="Audience" subtitle="Who's actually here">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <Label>Gender split</Label>
            <div className="mt-3 space-y-2">
              {Object.entries(metrics.genderSplit).map(([g, count]) => {
                const pctVal = metrics.totalUsers > 0 ? (count / metrics.totalUsers) * 100 : 0;
                return (
                  <div key={g}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink capitalize">{g}</span>
                      <span className="text-gray font-mono">{count} ({pctVal.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1 bg-stripe-white rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-wine" style={{ width: `${pctVal}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <Label>Top neighborhoods</Label>
            <div className="mt-3 space-y-2">
              {metrics.topNeighborhoods.length === 0 ? (
                <p className="text-gray-light text-sm">No data yet</p>
              ) : metrics.topNeighborhoods.map((n) => {
                const pctVal = metrics.totalUsers > 0 ? (n.count / metrics.totalUsers) * 100 : 0;
                return (
                  <div key={n.name}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink">{n.name}</span>
                      <span className="text-gray font-mono">{n.count}</span>
                    </div>
                    <div className="h-1 bg-stripe-white rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-wine" style={{ width: `${pctVal}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Safety">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <Label>Report rate</Label>
            <Big>{metrics.reportRate.toFixed(2)}%</Big>
            <p className="text-gray-light text-xs mt-1">Of MAU. Lower is better.</p>
          </Card>
          <Card>
            <Label>Pending verifications</Label>
            <Big>{metrics.pendingVerifications}</Big>
            <p className="text-gray-light text-xs mt-1">Selfies awaiting review</p>
          </Card>
        </div>
      </Section>

      <p className="text-gray-light text-xs font-mono tracking-wide text-center mt-16 pb-12">
        BLEND — Amsterdam · The coffee-first social platform.
      </p>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function Header({
  onRefresh,
  generatedAt,
  loading,
}: {
  onRefresh: () => void;
  generatedAt: number | null;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div>
        <Link
          href="/today"
          className="text-[10px] font-mono uppercase tracking-[0.3em] text-wine"
        >
          ← Back to app
        </Link>
        <h1 className="text-4xl font-display text-ink mt-2">Metrics</h1>
        <p className="text-ink-mid text-sm mt-1">
          {generatedAt
            ? `Updated ${new Date(generatedAt).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}`
            : "Loading…"}
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-4 py-2 rounded-full bg-wine text-cream text-sm font-medium hover:bg-burgundy transition-colors disabled:opacity-50"
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

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
    <section className="mt-12">
      <h2 className="text-2xl font-display text-ink">{title}</h2>
      {subtitle && <p className="text-gray text-sm mt-1">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">{children}</div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray">
      {children}
    </p>
  );
}

function Big({ children }: { children: React.ReactNode }) {
  return <p className="text-3xl font-display text-ink tabular-nums">{children}</p>;
}

function HeroStat({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "wine";
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-gray">
        {label}
      </p>
      <p className={`text-4xl font-display tabular-nums mt-2 ${accent === "wine" ? "text-wine" : "text-ink"}`}>
        {value}
      </p>
      {sublabel && <p className="text-gray-light text-xs mt-1">{sublabel}</p>}
    </div>
  );
}

function Row({ left, right }: { left: string; right: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-ink-mid">{left}</span>
      <span className="text-ink font-mono tabular-nums">{right}</span>
    </div>
  );
}

function Bench({
  value,
  bm,
}: {
  value: number;
  bm: { good: number; great: number };
}) {
  if (value >= bm.great) {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wide text-wine bg-wine/10 px-2 py-0.5 rounded-full">
        Great
      </span>
    );
  }
  if (value >= bm.good) {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wide text-coral bg-coral/10 px-2 py-0.5 rounded-full">
        Good
      </span>
    );
  }
  return (
    <span className="text-[10px] font-mono uppercase tracking-wide text-gray-light bg-stripe-white px-2 py-0.5 rounded-full">
      Below benchmark
    </span>
  );
}

function FunnelRow({
  label,
  count,
  total,
  accent,
}: {
  label: string;
  count: number;
  total: number;
  accent?: boolean;
}) {
  const ratio = total > 0 ? count / total : 0;
  const pctVal = ratio * 100;
  return (
    <div className="py-3 border-b border-stripe-white last:border-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`text-sm ${accent ? "text-wine font-medium" : "text-ink"}`}>
          {label}
        </span>
        <span className="text-sm font-mono tabular-nums text-ink">
          {count}
          <span className="text-gray-light"> · {pctVal.toFixed(0)}% of previous</span>
        </span>
      </div>
      <div className="h-1.5 bg-stripe-white rounded-full overflow-hidden">
        <div
          className={`h-full ${accent ? "bg-wine" : "bg-ink/40"}`}
          style={{ width: `${Math.max(2, pctVal)}%` }}
        />
      </div>
    </div>
  );
}

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

// ─── Cohort retention ────────────────────────────────────────────────────

function CohortTable({ cohorts }: { cohorts: CohortRow[] }) {
  if (cohorts.length === 0) {
    return (
      <Card>
        <p className="text-gray-light text-sm">
          No cohorts yet — come back after the first week of signups.
        </p>
      </Card>
    );
  }

  // Headline averages across measurable cohorts — what the analyst eyeballs
  // before reading rows. We weight by cohort size for fairness.
  const avg = (key: keyof CohortRow["retention"]) => {
    const measurable = cohorts.filter((c) => c.retention[key] !== null);
    if (measurable.length === 0) return null;
    const totalUsers = measurable.reduce((s, c) => s + c.size, 0);
    if (totalUsers === 0) return null;
    const weighted = measurable.reduce(
      (s, c) => s + (c.retention[key] as number) * c.size,
      0
    );
    return weighted / totalUsers;
  };

  const summary = {
    d1: avg("d1"),
    d7: avg("d7"),
    d30: avg("d30"),
  };

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryStat label="D1 retention" value={summary.d1} bm={BENCHMARKS.retentionD1} />
        <SummaryStat label="D7 retention" value={summary.d7} bm={BENCHMARKS.retentionD7} />
        <SummaryStat label="D30 retention" value={summary.d30} bm={BENCHMARKS.retentionD30} />
      </div>

      {/* Heatmap table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stripe-white">
              <th className="text-left p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray font-medium">Cohort</th>
              <th className="text-right p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray font-medium">Size</th>
              <th className="text-center p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray font-medium">D1</th>
              <th className="text-center p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray font-medium">D7</th>
              <th className="text-center p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray font-medium">D14</th>
              <th className="text-center p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray font-medium">D30</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c, idx) => (
              <tr
                key={c.weekStart}
                className={idx % 2 === 1 ? "bg-stripe-white/40" : ""}
              >
                <td className="p-4">
                  <div className="text-ink">{c.label}</div>
                  <div className="text-gray-light text-xs">{c.ageDays}d ago</div>
                </td>
                <td className="p-4 text-right text-ink font-mono tabular-nums">{c.size}</td>
                <RetentionCell value={c.retention.d1} />
                <RetentionCell value={c.retention.d7} />
                <RetentionCell value={c.retention.d14} />
                <RetentionCell value={c.retention.d30} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-gray-light text-xs">
        Each cell shows the share of that cohort still active N days after signup.
        Greyed cells = cohort not old enough yet to measure.
      </p>
    </div>
  );
}

function RetentionCell({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <td className="p-4 text-center">
        <span className="text-gray-light/60 font-mono">—</span>
      </td>
    );
  }
  // Three-tone color scale matched to BLEND palette
  const { bg, fg } =
    value >= 0.4
      ? { bg: "bg-wine", fg: "text-cream" }
      : value >= 0.2
      ? { bg: "bg-wine/30", fg: "text-ink" }
      : value >= 0.05
      ? { bg: "bg-coral/15", fg: "text-ink" }
      : { bg: "bg-stripe-white", fg: "text-gray" };
  return (
    <td className="p-2 text-center">
      <span
        className={`inline-block min-w-[3rem] py-1.5 px-2 rounded-md text-sm font-mono tabular-nums ${bg} ${fg}`}
      >
        {(value * 100).toFixed(0)}%
      </span>
    </td>
  );
}

function SummaryStat({
  label,
  value,
  bm,
}: {
  label: string;
  value: number | null;
  bm: { good: number; great: number; source: string };
}) {
  return (
    <Card>
      <Label>{label}</Label>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <Big>{value === null ? "—" : `${(value * 100).toFixed(0)}%`}</Big>
        {value !== null && <Bench value={value * 100} bm={{ good: bm.good * 100, great: bm.great * 100 }} />}
      </div>
      <p className="text-gray-light text-xs mt-1">{bm.source}</p>
    </Card>
  );
}
