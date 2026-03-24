/**
 * Add Spotify songs to all seed profiles.
 * Run with: npx tsx scripts/update-songs.ts
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

const SONGS: Record<string, string> = {
  seed_woman_0: "https://open.spotify.com/track/6habFhsOp2NvshLv26DqMb", // Shut Up and Dance
  seed_woman_1: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights
  seed_woman_2: "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3", // Shape of You
  seed_woman_3: "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr", // Cruel Summer
  seed_woman_4: "https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m", // bad guy
  seed_woman_5: "https://open.spotify.com/track/3yk7PJnryiJ8mAPqsrujzf", // Smalltown Boy
  seed_woman_6: "https://open.spotify.com/track/6AI3ezQ4o3HUoP6Dhudph3", // Still D.R.E.
  seed_woman_7: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT", // Never Gonna Give You Up
  seed_man_0: "https://open.spotify.com/track/3yk7PJnryiJ8mAPqsrujzf",   // Smalltown Boy
  seed_man_1: "https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20",   // Do I Wanna Know?
  seed_man_2: "https://open.spotify.com/track/2374M0fQpWi3dLnB54qaLX",   // Africa - Toto
  seed_man_3: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",   // Blinding Lights
  seed_man_4: "https://open.spotify.com/track/6habFhsOp2NvshLv26DqMb",   // Shut Up and Dance
  seed_man_5: "https://open.spotify.com/track/4PTG3Z6ehGkBFwjybzWkR8",   // Rick James
  seed_man_6: "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr",   // Cruel Summer
  seed_man_7: "https://open.spotify.com/track/2Fxmhks0bxGSBdJ92vM42m",   // bad guy
};

async function update() {
  console.log("🎵 Adding Spotify songs to seed profiles...\n");

  for (const [uid, song] of Object.entries(SONGS)) {
    await db.collection("users").doc(uid).update({ profileSong: song });
    console.log(`  ✓ ${uid}`);
  }

  console.log("\n✅ All seed profiles have songs!");
  process.exit(0);
}

update().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
