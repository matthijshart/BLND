/**
 * Direct fix: create today's daily batch for a user by picking the top
 * candidates server-side. Use this when /today on the device keeps
 * showing the "next drop" countdown despite candidates being available.
 *
 * Run:
 *   npx tsx scripts/force-batch.ts
 *   TARGET_EMAIL=other@email.com npx tsx scripts/force-batch.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";
import { join } from "path";

const TARGET_EMAIL = process.env.TARGET_EMAIL ?? "matthijsthart4@gmail.com";

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

// Same as lib/daily.ts — UTC date string
function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

(async () => {
  const user = await auth.getUserByEmail(TARGET_EMAIL).catch(() => null);
  if (!user) {
    console.error(`❌ No Auth user with email ${TARGET_EMAIL}`);
    process.exit(1);
  }
  const uid = user.uid;
  const date = todayString();
  console.log(`\nForce-creating daily batch for ${uid} on ${date}…\n`);

  // Wipe any existing daily docs first
  const existingSnap = await db
    .collection("users")
    .doc(uid)
    .collection("dailyProfiles")
    .get();
  for (const d of existingSnap.docs) {
    await d.ref.delete();
    console.log(`  ✓ Removed old dailyProfiles/${d.id}`);
  }

  // Load user's prefs
  const meSnap = await db.collection("users").doc(uid).get();
  const me = meSnap.data()!;
  const myGenderAsPref =
    me.gender === "man" ? "men" : me.gender === "woman" ? "women" : me.gender;

  // Pull all candidates and apply the same filters as fetchCandidateProfiles
  const allUsers = await db.collection("users").get();
  let candidates = allUsers.docs
    .map((d) => ({ uid: d.id, ...d.data() } as Record<string, unknown> & { uid: string }))
    .filter((u) => u.uid !== uid);

  // Their gender pref must accept me
  candidates = candidates.filter((u) => {
    const theirPref = (u.genderPreference as string[]) || [];
    if (theirPref.length === 0) return true;
    if (theirPref.includes("everyone")) return true;
    return theirPref.includes(myGenderAsPref);
  });

  // My gender pref
  if (me.genderPreference?.length && !me.genderPreference.includes("everyone")) {
    const genders = me.genderPreference.map((p: string) =>
      p === "men" ? "man" : p === "women" ? "woman" : p
    );
    candidates = candidates.filter((u) => genders.includes(u.gender));
  }

  // Age range
  if (me.ageRange) {
    const [minAge, maxAge] = me.ageRange;
    candidates = candidates.filter((u) => (u.age as number) >= minAge && (u.age as number) <= maxAge);
  }

  // Exclude already swiped
  const swipesSnap = await db.collection("swipes").where("swiperId", "==", uid).get();
  const swipedSet = new Set(swipesSnap.docs.map((d) => d.data().swipedId));
  candidates = candidates.filter((u) => !swipedSet.has(u.uid));

  // Exclude already matched
  const matchesSnap = await db
    .collection("matches")
    .where("users", "array-contains", uid)
    .get();
  const matchedSet = new Set<string>();
  matchesSnap.docs.forEach((d) => {
    (d.data().users as string[]).forEach((u) => {
      if (u !== uid) matchedSet.add(u);
    });
  });
  candidates = candidates.filter((u) => !matchedSet.has(u.uid));

  // Shuffle and take 10
  candidates.sort(() => Math.random() - 0.5);
  const picked = candidates.slice(0, 10);

  if (picked.length === 0) {
    console.error(`\n❌ No candidates available after filtering. Try re-seeding.`);
    process.exit(1);
  }

  await db
    .collection("users")
    .doc(uid)
    .collection("dailyProfiles")
    .doc(date)
    .set({
      date,
      profiles: picked.map((p) => p.uid),
      liked: [],
      passed: [],
    });

  console.log(`\n✅ Created batch with ${picked.length} profiles for today:`);
  picked.forEach((p) => {
    console.log(`  • ${p.displayName} (${p.age}, ${p.gender})`);
  });

  console.log(`\nNow open /today on your device. Force refresh if needed.\n`);
  process.exit(0);
})();
