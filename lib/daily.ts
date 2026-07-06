import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  limit,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User } from "@/types";

/** The hour (local time) at which the daily batch drops. Core BLEND ritual. */
export const DROP_HOUR = 11;

/**
 * LOCAL date string (YYYY-MM-DD) — the day flips at local midnight, so the
 * 11:00 drop gate works in the user's own timezone. (Previously used
 * toISOString() which is UTC — in Amsterdam that made "tomorrow" start at
 * 02:00 and the promised 11:00 ritual didn't exist at all.)
 */
export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** True when today's drop hasn't happened yet (local time). */
export function isBeforeDrop(now: Date = new Date()): boolean {
  return now.getHours() < DROP_HOUR;
}

export async function getDailyDoc(uid: string) {
  const date = todayString();
  const snap = await getDoc(doc(db, "users", uid, "dailyProfiles", date));
  return snap.exists() ? snap.data() : null;
}

export async function createDailyDoc(uid: string, profileUids: string[]) {
  const date = todayString();
  await setDoc(doc(db, "users", uid, "dailyProfiles", date), {
    date,
    profiles: profileUids,
    liked: [],
    passed: [],
  });
}

export async function markProfileAction(
  uid: string,
  profileUid: string,
  action: "like" | "pass"
) {
  const date = todayString();
  const field = action === "like" ? "liked" : "passed";
  await updateDoc(doc(db, "users", uid, "dailyProfiles", date), {
    [field]: arrayUnion(profileUid),
  });
}

export async function completeDailyBatch(uid: string) {
  const date = todayString();
  await updateDoc(doc(db, "users", uid, "dailyProfiles", date), {
    completedAt: serverTimestamp(),
  });
}

/**
 * Get UIDs the user has already swiped on (to avoid showing them again).
 */
async function getAlreadySwipedUids(uid: string): Promise<Set<string>> {
  const swiped = new Set<string>();

  // Get swipes from this user
  const swipeQuery = query(
    collection(db, "swipes"),
    where("swiperId", "==", uid),
    limit(500)
  );
  const swipeSnap = await getDocs(swipeQuery);
  swipeSnap.docs.forEach((d) => {
    swiped.add(d.data().swipedId);
  });

  return swiped;
}

/**
 * Get UIDs the user already has an active match with.
 */
async function getMatchedUids(uid: string): Promise<Set<string>> {
  const matched = new Set<string>();

  const matchQuery = query(
    collection(db, "matches"),
    where("users", "array-contains", uid)
  );
  const matchSnap = await getDocs(matchQuery);
  matchSnap.docs.forEach((d) => {
    const users = d.data().users as string[];
    const otherUid = users.find((u) => u !== uid);
    if (otherUid) matched.add(otherUid);
  });

  return matched;
}

/**
 * Fetch candidate profiles with smart filtering:
 * - Matches gender preference
 * - Within age range
 * - Not already swiped
 * - Not already matched
 * - Not self
 */
export async function fetchCandidateProfiles(
  uid: string,
  genderPref: string[],
  max: number = 10,
  currentUser?: User | null
): Promise<User[]> {
  const constraints = [];

  // Gender filter
  if (genderPref.length > 0 && !genderPref.includes("everyone")) {
    const genders = genderPref.map((p) =>
      p === "men" ? "man" : p === "women" ? "woman" : p
    );
    constraints.push(where("gender", "in", genders));
  }

  const q = query(
    collection(db, "users"),
    ...constraints,
    limit(50) // Fetch more to filter client-side
  );

  const snap = await getDocs(q);
  let users = snap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as User))
    .filter((u) => u.uid !== uid);

  // Age range filter (if current user has preferences)
  if (currentUser?.ageRange) {
    const [minAge, maxAge] = currentUser.ageRange;
    users = users.filter((u) => u.age >= minAge && u.age <= maxAge);
  }

  // Filter: also check that the OTHER person's gender pref matches the current user
  if (currentUser?.gender) {
    users = users.filter((u) => {
      if (!u.genderPreference || u.genderPreference.length === 0) return true;
      if (u.genderPreference.includes("everyone")) return true;
      // Map current user's gender to preference format
      const genderAsPref = currentUser.gender === "man" ? "men" : currentUser.gender === "woman" ? "women" : currentUser.gender;
      return u.genderPreference.includes(genderAsPref);
    });
  }

  // Exclude already swiped and matched users
  const [alreadySwiped, alreadyMatched] = await Promise.all([
    getAlreadySwipedUids(uid),
    getMatchedUids(uid),
  ]);

  // Mutual block filter: never show blocked users, and never show users who blocked you
  const myBlocked = new Set(currentUser?.blockedUsers || []);
  users = users.filter((u) => {
    if (myBlocked.has(u.uid)) return false;
    const theirBlocked = new Set(u.blockedUsers || []);
    if (theirBlocked.has(uid)) return false;
    return !alreadySwiped.has(u.uid) && !alreadyMatched.has(u.uid);
  });

  // Shuffle and return max
  const shuffled = users.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, max);
}
