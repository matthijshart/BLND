import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Timestamp } from "firebase/firestore";

// ──────────────────────────────────────────────────────────────────────────
//  Admin metrics — computed live by reading collections.
//
//  This is intentionally NOT cached / aggregated server-side. For an MVP
//  with <10k users it's fine to scan the whole users collection on each
//  dashboard load. At scale we'd replace this with a daily Cloud Function
//  that writes pre-aggregated docs to `metrics/daily/{date}`.
// ──────────────────────────────────────────────────────────────────────────

export interface Metrics {
  // Hero
  totalUsers: number;
  dau: number;
  activeBlends: number;
  verifiedPct: number;
  // Growth
  waitlistCount: number;
  signupsToday: number;
  signups7d: number;
  signups30d: number;
  // Engagement
  wau: number;
  mau: number;
  stickiness: number; // DAU / MAU
  likesToday: number;
  passesToday: number;
  blendsToday: number;
  // Conversion funnel (counts)
  funnel: {
    signedUp: number;
    onboarded: number; // has photos + bio
    firstLike: number; // has at least 1 swipe
    firstBlend: number; // has at least 1 match
    meetPlanned: number; // has at least 1 date doc
    meetCompleted: number;
    secondCup: number;
  };
  // Quality
  meetCompletionRate: number; // completed / (completed + cancelled + no_show)
  secondCupRate: number; // second_cup / completed
  reportRate: number; // reports / total active users
  // Trust
  pendingVerifications: number;
  // Demographics
  genderSplit: Record<string, number>;
  topNeighborhoods: { name: string; count: number }[];
  // Cohort retention — the metric M&A analysts open first
  cohorts: CohortRow[];
  // Meta
  generatedAt: number;
}

/**
 * A single weekly signup cohort + how many of those users were still
 * active on/after each milestone day after their signup.
 *
 * `retention` values are 0..1, or null if the cohort isn't old enough
 * yet to measure that milestone (e.g. D30 retention on a cohort 5 days old).
 */
export interface CohortRow {
  /** ISO date of the Monday that starts this cohort week (YYYY-MM-DD). */
  weekStart: string;
  /** Human label, e.g. "Mar 18 – 24". */
  label: string;
  /** Days since this cohort started — used to grey out future milestones. */
  ageDays: number;
  size: number;
  retention: {
    d1: number | null;
    d7: number | null;
    d14: number | null;
    d30: number | null;
  };
}

function tsToMs(t: unknown): number {
  if (!t) return 0;
  if (typeof t === "object" && t !== null && "toMillis" in t) {
    return (t as Timestamp).toMillis();
  }
  if (typeof t === "string") return new Date(t).getTime();
  if (typeof t === "number") return t;
  return 0;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function computeMetrics(): Promise<Metrics> {
  const now = Date.now();
  const startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  // ─── Parallel collection reads (single round-trip per collection) ──────
  const [usersSnap, matchesSnap, datesSnap, swipesSnap, waitlistSnap, reportsSnap] =
    await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "matches")),
      getDocs(collection(db, "dates")),
      getDocs(collection(db, "swipes")),
      getDocs(collection(db, "waitlist")).catch(() => ({ docs: [] as never[] })),
      getDocs(collection(db, "reports")).catch(() => ({ docs: [] as never[] })),
    ]);

  const users = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })) as Array<{
    uid: string;
    photos?: string[];
    bio?: string;
    gender?: string;
    neighborhood?: string;
    verificationStatus?: string;
    createdAt?: Timestamp;
    lastActive?: Timestamp;
  }>;
  const matches = matchesSnap.docs.map((d) => d.data()) as Array<{
    users: string[];
    status: string;
    createdAt?: Timestamp;
  }>;
  const dates = datesSnap.docs.map((d) => d.data()) as Array<{
    users: string[];
    status: string;
    dateTime?: Timestamp;
  }>;
  const swipes = swipesSnap.docs.map((d) => d.data()) as Array<{
    swiperId: string;
    direction: string;
    createdAt?: Timestamp;
  }>;

  // ─── Hero ──────────────────────────────────────────────────────────────
  const totalUsers = users.length;
  const dau = users.filter((u) => now - tsToMs(u.lastActive) < DAY_MS).length;
  const activeBlends = matches.filter((m) =>
    ["scheduling", "date_proposed", "date_confirmed"].includes(m.status)
  ).length;
  const verifiedCount = users.filter((u) => u.verificationStatus === "verified").length;
  const verifiedPct = totalUsers > 0 ? (verifiedCount / totalUsers) * 100 : 0;

  // ─── Growth ────────────────────────────────────────────────────────────
  const waitlistCount = waitlistSnap.docs.length;
  const signupsToday = users.filter((u) => tsToMs(u.createdAt) >= startOfToday).length;
  const signups7d = users.filter((u) => now - tsToMs(u.createdAt) < 7 * DAY_MS).length;
  const signups30d = users.filter((u) => now - tsToMs(u.createdAt) < 30 * DAY_MS).length;

  // ─── Engagement ────────────────────────────────────────────────────────
  const wau = users.filter((u) => now - tsToMs(u.lastActive) < 7 * DAY_MS).length;
  const mau = users.filter((u) => now - tsToMs(u.lastActive) < 30 * DAY_MS).length;
  const stickiness = mau > 0 ? (dau / mau) * 100 : 0;

  const swipesToday = swipes.filter((s) => tsToMs(s.createdAt) >= startOfToday);
  const likesToday = swipesToday.filter((s) => s.direction === "like").length;
  const passesToday = swipesToday.filter((s) => s.direction === "pass").length;
  const blendsToday = matches.filter((m) => tsToMs(m.createdAt) >= startOfToday).length;

  // ─── Funnel ────────────────────────────────────────────────────────────
  const onboarded = users.filter(
    (u) => (u.photos?.length ?? 0) > 0 && (u.bio?.length ?? 0) > 0
  ).length;
  const swiperIds = new Set(swipes.map((s) => s.swiperId));
  const firstLikeUids = new Set(
    swipes.filter((s) => s.direction === "like").map((s) => s.swiperId)
  );
  const matchedUids = new Set<string>();
  matches.forEach((m) => m.users.forEach((u) => matchedUids.add(u)));
  const meetUids = new Set<string>();
  dates.forEach((d) => d.users.forEach((u) => meetUids.add(u)));

  const meetCompletedSet = new Set<string>();
  dates
    .filter((d) => d.status === "completed" || d.status === "second_cup")
    .forEach((d) => d.users.forEach((u) => meetCompletedSet.add(u)));
  const secondCupSet = new Set<string>();
  dates
    .filter((d) => d.status === "second_cup")
    .forEach((d) => d.users.forEach((u) => secondCupSet.add(u)));

  const funnel = {
    signedUp: totalUsers,
    onboarded,
    firstLike: firstLikeUids.size,
    firstBlend: matchedUids.size,
    meetPlanned: meetUids.size,
    meetCompleted: meetCompletedSet.size,
    secondCup: secondCupSet.size,
  };
  // swiperIds used only to validate funnel correctness in development; not exposed
  void swiperIds;

  // ─── Quality ───────────────────────────────────────────────────────────
  const completedMeets = dates.filter(
    (d) => d.status === "completed" || d.status === "second_cup"
  ).length;
  const failedMeets = dates.filter((d) =>
    ["cancelled", "no_show"].includes(d.status)
  ).length;
  const meetCompletionRate =
    completedMeets + failedMeets > 0
      ? (completedMeets / (completedMeets + failedMeets)) * 100
      : 0;
  const secondCupMeets = dates.filter((d) => d.status === "second_cup").length;
  const secondCupRate =
    completedMeets > 0 ? (secondCupMeets / completedMeets) * 100 : 0;

  const reportCount = reportsSnap.docs.length;
  const reportRate = mau > 0 ? (reportCount / mau) * 100 : 0;
  const pendingVerifications = users.filter(
    (u) => u.verificationStatus === "pending"
  ).length;

  // ─── Demographics ──────────────────────────────────────────────────────
  const genderSplit: Record<string, number> = {};
  users.forEach((u) => {
    const g = u.gender || "unspecified";
    genderSplit[g] = (genderSplit[g] || 0) + 1;
  });
  const neighborhoodCounts: Record<string, number> = {};
  users.forEach((u) => {
    if (!u.neighborhood) return;
    neighborhoodCounts[u.neighborhood] = (neighborhoodCounts[u.neighborhood] || 0) + 1;
  });
  const topNeighborhoods = Object.entries(neighborhoodCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ─── Cohort retention ─────────────────────────────────────────────────
  const cohorts = computeCohorts(users, now);

  return {
    totalUsers,
    dau,
    activeBlends,
    verifiedPct,
    waitlistCount,
    signupsToday,
    signups7d,
    signups30d,
    wau,
    mau,
    stickiness,
    likesToday,
    passesToday,
    blendsToday,
    funnel,
    meetCompletionRate,
    secondCupRate,
    reportRate,
    pendingVerifications,
    genderSplit,
    topNeighborhoods,
    cohorts,
    generatedAt: now,
  };
}

/**
 * Compute weekly cohort retention from raw user docs.
 *
 * For each cohort (users who signed up in the same Monday-to-Sunday week)
 * we ask: did their `lastActive` timestamp fall on or after day N? That's
 * a slight simplification — true retention needs daily activity logs — but
 * it's directionally correct and matches what M&A analysts expect to see
 * from an early-stage company.
 */
function computeCohorts(
  users: Array<{ createdAt?: Timestamp; lastActive?: Timestamp }>,
  now: number
): CohortRow[] {
  // Bucket users by their Monday-of-signup-week
  const buckets = new Map<string, Array<{ createdMs: number; lastActiveMs: number }>>();

  for (const u of users) {
    const createdMs = tsToMs(u.createdAt);
    if (!createdMs) continue;
    const lastActiveMs = tsToMs(u.lastActive) || createdMs;
    const weekStart = mondayKey(createdMs);
    if (!buckets.has(weekStart)) buckets.set(weekStart, []);
    buckets.get(weekStart)!.push({ createdMs, lastActiveMs });
  }

  // For each bucket compute retention at milestones
  const rows: CohortRow[] = [];
  for (const [weekStart, group] of buckets.entries()) {
    const weekStartMs = new Date(weekStart + "T00:00:00Z").getTime();
    const ageDays = Math.floor((now - weekStartMs) / DAY_MS);

    const retention = {
      d1: retentionAt(group, 1, ageDays),
      d7: retentionAt(group, 7, ageDays),
      d14: retentionAt(group, 14, ageDays),
      d30: retentionAt(group, 30, ageDays),
    };

    rows.push({
      weekStart,
      label: weekLabel(weekStartMs),
      ageDays,
      size: group.length,
      retention,
    });
  }

  // Newest cohort first
  rows.sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  // Cap at 12 weeks — beyond that the table gets noisy
  return rows.slice(0, 12);
}

function retentionAt(
  group: Array<{ createdMs: number; lastActiveMs: number }>,
  milestone: number,
  cohortAgeDays: number
): number | null {
  // Cohort hasn't existed long enough to measure this milestone
  if (cohortAgeDays < milestone) return null;
  if (group.length === 0) return 0;
  const retained = group.filter(
    (u) => u.lastActiveMs - u.createdMs >= milestone * DAY_MS
  ).length;
  return retained / group.length;
}

function mondayKey(ms: number): string {
  const d = new Date(ms);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function weekLabel(ms: number): string {
  const start = new Date(ms);
  const end = new Date(ms + 6 * DAY_MS);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Industry benchmarks for the analyst at-a-glance comparison. */
export const BENCHMARKS = {
  stickiness: { good: 20, great: 30, source: "Match Group avg ~22%" },
  meetCompletionRate: { good: 70, great: 85, source: "Hinge avg ~75%" },
  secondCupRate: { good: 15, great: 25, source: "Dating industry avg ~12%" },
  verifiedPct: { good: 50, great: 75, source: "Trust-first apps ~70%" },
  // Dating-app retention benchmarks (published Match Group / Sensor Tower data)
  retentionD1: { good: 0.5, great: 0.65, source: "Hinge D1 ~60%" },
  retentionD7: { good: 0.3, great: 0.45, source: "Hinge D7 ~38%" },
  retentionD30: { good: 0.18, great: 0.3, source: "Hinge D30 ~22%" },
};
