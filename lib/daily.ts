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

function todayString() {
  return new Date().toISOString().split("T")[0];
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

export async function fetchCandidateProfiles(
  uid: string,
  genderPref: string[],
  max: number = 10
): Promise<User[]> {
  // MVP: fetch users matching gender preference, exclude self
  // Firestore doesn't support != on document ID, so we filter client-side
  const constraints = [];

  if (genderPref.length > 0 && !genderPref.includes("everyone")) {
    // Map preferences to genders: "men" -> "man", "women" -> "woman"
    const genders = genderPref.map((p) =>
      p === "men" ? "man" : p === "women" ? "woman" : p
    );
    constraints.push(where("gender", "in", genders));
  }

  const q = query(
    collection(db, "users"),
    ...constraints,
    limit(30)
  );

  const snap = await getDocs(q);
  const users = snap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as User))
    .filter((u) => u.uid !== uid);

  // Shuffle and take max
  const shuffled = users.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, max);
}
