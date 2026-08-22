/**
 * Hard-reset Matthijs's daily batch — deletes today's daily doc, all
 * past dailyProfiles, AND any like-swipes on seed profiles so the
 * matching pool refills. Use when you want to swipe NOW without
 * waiting for tomorrow's drop.
 *
 * Run:
 *   npx tsx scripts/reset-my-batch.ts
 *   TARGET_EMAIL=other@email.com npx tsx scripts/reset-my-batch.ts
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

async function run() {
  console.log(`🔄 Hard-resetting batch for ${TARGET_EMAIL}…\n`);

  const user = await auth.getUserByEmail(TARGET_EMAIL).catch(() => null);
  if (!user) {
    console.error(`❌ No Auth user with email ${TARGET_EMAIL}`);
    process.exit(1);
  }
  const uid = user.uid;
  console.log(`✓ Resolved UID: ${uid}\n`);

  // 1. Delete all daily docs (today + any leftover from past days)
  const dailySnap = await db
    .collection("users")
    .doc(uid)
    .collection("dailyProfiles")
    .get();
  console.log(`Found ${dailySnap.size} daily docs.`);
  for (const d of dailySnap.docs) {
    await d.ref.delete();
    console.log(`  ✓ Deleted dailyProfiles/${d.id}`);
  }

  // 2. Delete swipes ON seed profiles (so they can show up again)
  const swipesSnap = await db
    .collection("swipes")
    .where("swiperId", "==", uid)
    .get();
  let swipesDeleted = 0;
  for (const s of swipesSnap.docs) {
    const swipedId: string = s.data().swipedId;
    if (swipedId.startsWith("seed_")) {
      await s.ref.delete();
      swipesDeleted++;
    }
  }
  console.log(`\n✓ Deleted ${swipesDeleted} of your previous swipes on seed profiles`);

  // 3. Reset dateTokens + lastActive
  await db.collection("users").doc(uid).update({
    dateTokens: 0,
    lastActive: new Date(),
  });

  console.log(`\n✅ Done. Reload /today on your phone — you can swipe immediately.\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
