import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Strike, User } from "@/types";

// ──────────────────────────────────────────────────────────────────────────
//  BLEND Etiquette enforcement
//
//  Anti-flake architecture per Matthijs + Rick:
//  - Timing-weighted cancellation strikes
//  - Permanent ban (NOT delete — prevents re-creating a fresh account)
//  - 60-day rolling window
//  - No-show = single instant ban (zero tolerance)
//
//  Permanent ban means: account stays in Firestore but `bannedAt` is set.
//  AuthProvider checks this on every load and blocks access. The user can't
//  delete and recreate because their email/uid is permanently flagged.
// ──────────────────────────────────────────────────────────────────────────

export const STRIKE_WINDOW_DAYS = 60;
const STRIKE_WINDOW_MS = STRIKE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Thresholds — how many strikes of each kind trigger a permanent ban
 * within the rolling window. No-shows are instant.
 */
export const STRIKE_THRESHOLDS = {
  last_minute: 2, // <2h before meet
  close: 3,       // 2-24h before meet
  far: 5,         // >24h before meet (warning only — no ban from this alone)
};

/**
 * Classify how close to the meet time the cancellation happened.
 * This determines how heavily the strike counts.
 */
export function classifyCancellationTiming(
  meetTime: Date | Timestamp,
  cancelTime: Date = new Date()
): "far" | "close" | "last_minute" {
  const meetMs = meetTime instanceof Timestamp ? meetTime.toMillis() : meetTime.getTime();
  const hoursUntilMeet = (meetMs - cancelTime.getTime()) / (60 * 60 * 1000);
  if (hoursUntilMeet < 2) return "last_minute";
  if (hoursUntilMeet < 24) return "close";
  return "far";
}

/** Canonical cancellation reasons surfaced in the picker. */
export const CANCELLATION_REASONS = [
  { value: "sick", label: "I'm sick / not feeling well" },
  { value: "work_emergency", label: "Work emergency" },
  { value: "family_emergency", label: "Family emergency" },
  { value: "no_longer_interested", label: "I'm no longer interested" },
  { value: "met_someone", label: "I've met someone else" },
  { value: "other", label: "Other" },
] as const;

/**
 * Filter strikes to those within the rolling window.
 * Used everywhere we count toward ban thresholds.
 */
export function activeStrikes(user: Pick<User, "strikes">): Strike[] {
  const cutoff = Date.now() - STRIKE_WINDOW_MS;
  return (user.strikes || []).filter((s) => {
    const ms = s.createdAt?.toMillis?.() ?? 0;
    return ms >= cutoff;
  });
}

export interface StrikeStatus {
  /** Count of each timing type within the window. */
  lastMinute: number;
  close: number;
  far: number;
  noShows: number;
  /** How many of THIS timing type they have left before ban. */
  oneMoreBans: ("last_minute" | "close" | "far" | "no_show") | null;
  /** True if user should already be banned. */
  shouldBan: boolean;
}

/**
 * Compute the user's current standing — counts + how close they are
 * to a ban. Used in the cancel modal to show "this is your 2nd of 3".
 */
export function getStrikeStatus(user: Pick<User, "strikes">): StrikeStatus {
  const active = activeStrikes(user);

  const lastMinute = active.filter((s) => s.type === "cancellation" && s.timing === "last_minute").length;
  const close = active.filter((s) => s.type === "cancellation" && s.timing === "close").length;
  const far = active.filter((s) => s.type === "cancellation" && s.timing === "far").length;
  const noShows = active.filter((s) => s.type === "no_show").length;

  // What's the most pressing threshold? Pick the timing where adding one
  // more strike would trigger a ban — surface that to the user.
  let oneMoreBans: StrikeStatus["oneMoreBans"] = null;
  if (lastMinute + 1 >= STRIKE_THRESHOLDS.last_minute) oneMoreBans = "last_minute";
  else if (close + 1 >= STRIKE_THRESHOLDS.close) oneMoreBans = "close";
  // far doesn't ban; skip
  // no_show always: any new no_show bans immediately

  const shouldBan =
    lastMinute >= STRIKE_THRESHOLDS.last_minute ||
    close >= STRIKE_THRESHOLDS.close ||
    noShows >= 1;

  return { lastMinute, close, far, noShows, oneMoreBans, shouldBan };
}

/**
 * Decide if adding a hypothetical NEXT strike would push the user over the
 * ban threshold. Caller uses this to show the "this will ban you" warning.
 */
export function wouldBanWithNext(
  user: Pick<User, "strikes">,
  next: { type: "cancellation"; timing: "far" | "close" | "last_minute" } | { type: "no_show" }
): boolean {
  if (next.type === "no_show") return true; // any no-show bans
  const s = getStrikeStatus(user);
  if (next.timing === "last_minute") return s.lastMinute + 1 >= STRIKE_THRESHOLDS.last_minute;
  if (next.timing === "close") return s.close + 1 >= STRIKE_THRESHOLDS.close;
  return false; // far never bans
}

/**
 * Record a cancellation strike against the user who cancelled.
 * Returns whether the user was banned as a result.
 */
export async function recordCancellation(
  uid: string,
  dateId: string,
  reason: string,
  timing: "far" | "close" | "last_minute"
): Promise<{ banned: boolean }> {
  const strike: Strike = {
    type: "cancellation",
    timing,
    reason,
    dateId,
    createdAt: Timestamp.now(),
  };

  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    strikes: arrayUnion(strike),
  });

  // Re-read to check thresholds with the new strike included
  const snap = await getDoc(userRef);
  const u = snap.data() as User | undefined;
  if (!u) return { banned: false };

  const status = getStrikeStatus(u);
  if (status.shouldBan) {
    await banUser(uid, "repeated_cancellations");
    return { banned: true };
  }
  return { banned: false };
}

/**
 * Record a no-show — instant ban.
 */
export async function recordNoShow(
  noShowUid: string,
  dateId: string,
  reportedBy: string
): Promise<void> {
  const strike: Strike = {
    type: "no_show",
    dateId,
    reportedBy,
    createdAt: Timestamp.now(),
  };
  const userRef = doc(db, "users", noShowUid);
  await updateDoc(userRef, {
    strikes: arrayUnion(strike),
  });
  await banUser(noShowUid, "no_show");
}

/**
 * Permanent ban. Sets `bannedAt`, expires every active match/date so the
 * other party isn't left hanging, and the AuthProvider gate kicks them out.
 */
export async function banUser(
  uid: string,
  reason: "repeated_cancellations" | "no_show" | "manual"
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    bannedAt: serverTimestamp(),
    banReason: reason,
  });

  // Cancel all active matches so the other party gets notified and freed up
  const matchesSnap = await getDocs(
    query(
      collection(db, "matches"),
      where("users", "array-contains", uid)
    )
  );
  const datesSnap = await getDocs(
    query(
      collection(db, "dates"),
      where("users", "array-contains", uid)
    )
  );

  const batch = writeBatch(db);
  matchesSnap.docs.forEach((d) => {
    const status = d.data().status;
    if (!["completed", "cancelled", "expired"].includes(status)) {
      batch.update(d.ref, { status: "cancelled" });
    }
  });
  datesSnap.docs.forEach((d) => {
    const status = d.data().status;
    if (!["completed", "cancelled", "no_show", "second_cup"].includes(status)) {
      batch.update(d.ref, { status: "cancelled" });
    }
  });
  await batch.commit();
}

/**
 * Admin-only: clear a single strike (e.g. user produced a doctor's note).
 * If the user was banned because of that strike, this does NOT auto-unban —
 * admin must also clear `bannedAt` separately (done in admin UI).
 */
export async function removeStrike(uid: string, dateId: string, type: Strike["type"]): Promise<void> {
  const snap = await getDoc(doc(db, "users", uid));
  const u = snap.data() as User | undefined;
  if (!u?.strikes) return;
  const filtered = u.strikes.filter(
    (s) => !(s.dateId === dateId && s.type === type)
  );
  await updateDoc(doc(db, "users", uid), { strikes: filtered });
}

/** Admin-only: lift a ban. Strikes stay on record. */
export async function unbanUser(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    bannedAt: null,
    banReason: null,
  });
}
