import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { User, WaitlistEntry } from "@/types";

// Users
export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function createUser(uid: string, data: Partial<User>) {
  return setDoc(doc(db, "users", uid), {
    ...data,
    uid,
    dateTokens: 0,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  });
}

export async function updateUser(uid: string, data: Partial<User>) {
  return updateDoc(doc(db, "users", uid), {
    ...data,
    lastActive: serverTimestamp(),
  } as DocumentData);
}

// Waitlist
export async function addToWaitlist(email: string, city: string, source?: string) {
  return addDoc(collection(db, "waitlist"), {
    email,
    city,
    source: source ?? "landing_page",
    createdAt: serverTimestamp(),
  } satisfies Omit<WaitlistEntry, "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> });
}

// Swipes
export async function recordSwipe(
  swiperId: string,
  swipedId: string,
  direction: "like" | "pass",
  date: string
) {
  return addDoc(collection(db, "swipes"), {
    swiperId,
    swipedId,
    direction,
    date,
    createdAt: serverTimestamp(),
  });
}

// Matches
export async function getMatchesForUser(uid: string) {
  const q = query(
    collection(db, "matches"),
    where("users", "array-contains", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Dates
export async function getDatesForUser(uid: string) {
  const q = query(
    collection(db, "dates"),
    where("users", "array-contains", uid),
    orderBy("dateTime", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
