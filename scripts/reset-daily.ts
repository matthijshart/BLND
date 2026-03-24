/**
 * Reset daily batches for all users so they can swipe again.
 * Run with: npx tsx scripts/reset-daily.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function resetDaily() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`🔄 Resetting daily batches for ${today}...\n`);

  const usersSnap = await db.collection("users").get();
  let count = 0;

  for (const userDoc of usersSnap.docs) {
    // Skip seed profiles
    if (userDoc.id.startsWith("seed_")) continue;

    const dailyRef = db.collection("users").doc(userDoc.id).collection("dailyProfiles").doc(today);
    const dailySnap = await dailyRef.get();

    if (dailySnap.exists) {
      await dailyRef.delete();
      console.log(`  ✓ Reset ${userDoc.data().displayName || userDoc.id}`);
      count++;
    }
  }

  console.log(`\n✅ Reset ${count} daily batches. Users can swipe again!`);
  process.exit(0);
}

resetDaily().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
