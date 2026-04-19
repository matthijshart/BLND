/**
 * Add 10 MORE fake profiles on top of the existing ones (different UIDs).
 * Run: npx tsx scripts/seed-more-profiles.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const NEIGHBORHOODS = [
  "Centrum", "Jordaan", "De Pijp", "Oost", "West", "Noord", "Zuid",
  "Oud-West", "Oud-Zuid", "Westerpark",
];

const INTERESTS_POOL = [
  "specialty coffee", "cycling", "art", "vinyl", "reading", "yoga",
  "cooking", "live music", "running", "photography", "design", "travel",
  "natural wine", "cinema", "museums", "climbing", "festivals", "podcasts",
  "sports", "tennis", "padel", "football", "surfing", "skating",
];

const COFFEE_ORDERS = [
  "Cortado, always",
  "Americano with a splash",
  "Iced oat latte",
  "Single origin pour-over",
  "Flat white, no sugar",
  "Matcha, ceremonial grade",
  "Cappuccino, old-school",
  "Decaf espresso (judge me)",
  "Whatever's on the bar",
  "Filter, black, no small talk",
];

const PROMPTS = [
  { question: "A hill I'll die on?", answers: [
    "Oat milk is objectively the best milk alternative",
    "Tipping culture should not be a thing in Amsterdam",
    "Terraces should be open year-round",
    "Everyone should own at least one houseplant",
  ]},
  { question: "Electric bike or normal bike?", answers: [
    "Normal. I have legs for a reason",
    "Electric. Life's too short for headwind",
    "I walk. Controversial, I know",
  ]},
  { question: "Best spot in Amsterdam nobody knows about?", answers: [
    "That tiny café behind the Westerkerk with no sign",
    "The rooftop of NEMO at sunset. Free entrance",
    "Flevopark on a summer morning. Just me and the ducks",
    "The hidden garden behind the Begijnhof",
  ]},
  { question: "What I order on a first coffee?", answers: [
    "Whatever they recommend. I trust the barista",
    "Double espresso. Shows confidence, right?",
    "Oat flat white. I'm basic and I own it",
    "Chai latte. I know it's not coffee. I don't care",
  ]},
  { question: "Swapfiets or VanMoof?", answers: [
    "Swapfiets — low drama, does the job",
    "VanMoof — I like living dangerously",
    "Neither. I bought my own. I'm adult now",
  ]},
];

const SPOTIFY_SONGS = [
  "https://open.spotify.com/track/3yk7PJnryiJ8mAPqsrujzf",
  "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr",
  "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
  "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3",
  "",
  "",
];

// 10 NEW profiles — distinct from existing 16
const NEW_PROFILES = [
  { name: "Olivia", gender: "woman", age: 27, neighborhood: "Jordaan", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop", bio: "Illustrator. Canal rat. Always one market away from a new ceramic bowl." },
  { name: "Mila", gender: "woman", age: 31, neighborhood: "De Pijp", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=800&fit=crop", bio: "PR by trade, poet by night. Coffee is my love language." },
  { name: "Sien", gender: "woman", age: 26, neighborhood: "Noord", photo: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&h=800&fit=crop", bio: "Film photographer. Ferry commuter. Believer in the long walk home." },
  { name: "Noor", gender: "woman", age: 29, neighborhood: "West", photo: "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?w=600&h=800&fit=crop", bio: "Architect. Tattoo collector. Books over bars, always." },
  { name: "Tess", gender: "woman", age: 34, neighborhood: "Oud-Zuid", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop", bio: "Moved from Cape Town in 2022. Still learning Dutch. Still losing." },
  { name: "Sam", gender: "man", age: 28, neighborhood: "Westerpark", photo: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&h=800&fit=crop", bio: "UX designer. Runs mornings, cooks evenings. Best pasta in Amsterdam contender." },
  { name: "Joost", gender: "man", age: 32, neighborhood: "Centrum", photo: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=600&h=800&fit=crop", bio: "Bookseller at Athenaeum. Dutch film nerd. Likes his coffee strong and his playlists stranger." },
  { name: "Milan", gender: "man", age: 30, neighborhood: "Oost", photo: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=600&h=800&fit=crop", bio: "Product manager who'd rather be a potter. Working on it." },
  { name: "Ruben", gender: "man", age: 26, neighborhood: "De Pijp", photo: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=600&h=800&fit=crop", bio: "Chef at a tiny wine bar (ironic, I know). Off on Mondays. Tell me your guilty pleasure." },
  { name: "Levi", gender: "man", age: 29, neighborhood: "Jordaan", photo: "https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=600&h=800&fit=crop", bio: "Photographer. Half Dutch half Spanish. If you see me, I'm probably lost." },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function run() {
  console.log("🌱 Adding 10 new seed profiles...\n");

  for (let i = 0; i < NEW_PROFILES.length; i++) {
    const p = NEW_PROFILES[i];
    const uid = `seed_extra_${p.gender}_${i}`;
    const interests = pickN(INTERESTS_POOL, 4 + Math.floor(Math.random() * 4));
    const song = pick(SPOTIFY_SONGS);
    const selectedPrompts = pickN(PROMPTS, 3).map((q) => ({
      question: q.question,
      answer: pick(q.answers),
    }));
    const coffeeOrder = pick(COFFEE_ORDERS);

    const data: Record<string, unknown> = {
      uid,
      displayName: p.name,
      age: p.age,
      bio: p.bio,
      photos: [p.photo],
      neighborhood: p.neighborhood,
      interests,
      lookingFor: pick(["dating", "dating", "dating", "friends", "open"]),
      coffeeOrder,
      prompts: selectedPrompts,
      gender: p.gender,
      genderPreference: p.gender === "woman" ? ["men"] : ["women"],
      ageRange: [22, 40],
      dateTokens: 0,
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
    };
    if (song) data.profileSong = song;

    await db.collection("users").doc(uid).set(data);
    console.log(`  ✓ ${p.name}, ${p.age} (${p.gender}) — ${p.neighborhood}`);
  }

  console.log(`\n✅ Added ${NEW_PROFILES.length} new profiles.`);
  process.exit(0);
}

run().catch((err) => { console.error("❌", err); process.exit(1); });
