import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Match, User } from "@/types";

/**
 * Check if two users have mutually liked each other.
 */
export async function checkForMatch(
  swiperId: string,
  swipedId: string
): Promise<boolean> {
  const q = query(
    collection(db, "swipes"),
    where("swiperId", "==", swipedId),
    where("swipedId", "==", swiperId),
    where("direction", "==", "like")
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Create a new match between two users.
 */
export async function createMatch(
  userA: string,
  userB: string
): Promise<string> {
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  );

  const docRef = await addDoc(collection(db, "matches"), {
    users: [userA, userB],
    status: "scheduling",
    availability: {},
    confirmedBy: [],
    createdAt: serverTimestamp(),
    expiresAt,
  });

  return docRef.id;
}

/**
 * Get a match with the other user's profile.
 */
export async function getMatchWithProfile(
  matchId: string,
  currentUid: string
): Promise<{ match: Match; otherUser: User } | null> {
  const snap = await getDoc(doc(db, "matches", matchId));
  if (!snap.exists()) return null;

  const match = { id: snap.id, ...snap.data() } as Match;
  const otherUid = match.users.find((uid) => uid !== currentUid);
  if (!otherUid) return null;

  const userSnap = await getDoc(doc(db, "users", otherUid));
  if (!userSnap.exists()) return null;

  return {
    match,
    otherUser: userSnap.data() as User,
  };
}
