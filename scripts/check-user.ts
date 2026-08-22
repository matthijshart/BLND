/**
 * Diagnostic: simulate fetchCandidateProfiles for a given UID and report
 * how many candidates pass each filter step.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const TARGET_UID = process.env.UID ?? "9XMFoyTJpyenAEJ1hYLtIMKWuml2";

(async () => {
  const meSnap = await db.collection("users").doc(TARGET_UID).get();
  if (!meSnap.exists) {
    console.error("No user doc");
    process.exit(1);
  }
  const me = meSnap.data()!;
  console.log(`\n=== You (${me.displayName}) ===`);
  console.log(`  gender: ${me.gender}`);
  console.log(`  genderPreference: ${JSON.stringify(me.genderPreference)}`);
  console.log(`  ageRange: ${JSON.stringify(me.ageRange)}`);
  console.log(`  blockedUsers: ${(me.blockedUsers || []).length}`);

  const allUsers = await db.collection("users").get();
  let candidates = allUsers.docs
    .map((d) => ({ uid: d.id, ...d.data() } as Record<string, unknown> & { uid: string }))
    .filter((u) => u.uid !== TARGET_UID);
  console.log(`\nTotal other users: ${candidates.length}`);

  // 1. Gender pref
  if (me.genderPreference?.length && !me.genderPreference.includes("everyone")) {
    const genders = me.genderPreference.map((p: string) =>
      p === "men" ? "man" : p === "women" ? "woman" : p
    );
    candidates = candidates.filter((u) => genders.includes(u.gender));
    console.log(`After your gender filter (${me.genderPreference.join(",")}): ${candidates.length}`);
  } else {
    console.log(`No gender filter (everyone)`);
  }

  // 2. Age range
  if (me.ageRange) {
    const [minAge, maxAge] = me.ageRange;
    const before = candidates.length;
    candidates = candidates.filter((u) => (u.age as number) >= minAge && (u.age as number) <= maxAge);
    console.log(`After age range [${minAge}-${maxAge}]: ${candidates.length} (dropped ${before - candidates.length})`);
  }

  // 3. Reverse gender pref
  const myGenderAsPref = me.gender === "man" ? "men" : me.gender === "woman" ? "women" : me.gender;
  const before = candidates.length;
  candidates = candidates.filter((u) => {
    const theirPref = (u.genderPreference as string[]) || [];
    if (theirPref.length === 0) return true;
    if (theirPref.includes("everyone")) return true;
    return theirPref.includes(myGenderAsPref);
  });
  console.log(`After their pref (must accept ${myGenderAsPref}): ${candidates.length} (dropped ${before - candidates.length})`);

  // 4. Already swiped
  const swipesSnap = await db.collection("swipes").where("swiperId", "==", TARGET_UID).get();
  const swipedSet = new Set(swipesSnap.docs.map((d) => d.data().swipedId));
  const beforeSwipe = candidates.length;
  candidates = candidates.filter((u) => !swipedSet.has(u.uid));
  console.log(`After excluding already-swiped (${swipesSnap.size} total): ${candidates.length} (dropped ${beforeSwipe - candidates.length})`);

  // 5. Already matched
  const matchesSnap = await db
    .collection("matches")
    .where("users", "array-contains", TARGET_UID)
    .get();
  const matchedSet = new Set<string>();
  matchesSnap.docs.forEach((d) => {
    (d.data().users as string[]).forEach((u) => {
      if (u !== TARGET_UID) matchedSet.add(u);
    });
  });
  const beforeMatch = candidates.length;
  candidates = candidates.filter((u) => !matchedSet.has(u.uid));
  console.log(`After excluding matched: ${candidates.length} (dropped ${beforeMatch - candidates.length})`);

  console.log(`\n✅ Final candidate count: ${candidates.length}`);
  if (candidates.length > 0) {
    console.log(`Sample:`);
    candidates.slice(0, 8).forEach((c) => {
      console.log(`  • ${c.displayName} (${c.age}, ${c.gender}, prefs ${JSON.stringify(c.genderPreference)})`);
    });
  }

  process.exit(0);
})();
