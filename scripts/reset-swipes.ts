/**
 * Reset all swipes for a user so they see all profiles again.
 * Run with: npx tsx scripts/reset-swipes.ts
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

async function resetSwipes() {
  console.log("🔄 Resetting all swipes and daily batches...\n");

  // Delete all swipes
  const swipesSnap = await db.collection("swipes").get();
  let swipeCount = 0;
  for (const doc of swipesSnap.docs) {
    await doc.ref.delete();
    swipeCount++;
  }
  console.log(`  ✓ Deleted ${swipeCount} swipes`);

  // Delete all daily batches for real users
  const usersSnap = await db.collection("users").get();
  let batchCount = 0;
  for (const userDoc of usersSnap.docs) {
    if (userDoc.id.startsWith("seed_")) continue;
    const dailySnap = await db.collection("users").doc(userDoc.id).collection("dailyProfiles").get();
    for (const dailyDoc of dailySnap.docs) {
      await dailyDoc.ref.delete();
      batchCount++;
    }
  }
  console.log(`  ✓ Deleted ${batchCount} daily batches`);

  console.log("\n✅ Everything reset! Refresh the app to see all profiles again.");
  process.exit(0);
}

resetSwipes().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
