/**
 * Seed script — creates fake test profiles in Firestore.
 * Run with: npx tsx scripts/seed-profiles.ts
 *
 * Uses Firebase Admin SDK with service account.
 * Before running, download your service account key from:
 * Firebase Console → Project Settings → Service Accounts → Generate new private key
 * Save as: scripts/serviceAccountKey.json
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccountKey.json"), "utf-8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const NEIGHBORHOODS = [
  "Centrum", "Jordaan", "De Pijp", "Oost", "West", "Noord", "Zuid",
  "Oud-West", "Oud-Zuid", "Westerpark",
];

const INTERESTS_POOL = [
  "specialty coffee", "cycling", "art", "vinyl", "reading", "yoga",
  "cooking", "live music", "running", "photography", "design", "travel",
  "natural wine", "cinema", "museums", "climbing", "festivals", "podcasts",
];

const COFFEE_ORDERS = [
  "Oat flat white",
  "Espresso, nothing else",
  "Cappuccino with oat milk",
  "Iced latte, always",
  "Double espresso",
  "Chai latte",
  "Cortado",
  "Filter coffee, black",
  "Matcha oat latte",
  "Flat white, extra shot",
];

const PROMPTS = [
  { question: "Swapfiets or VanMoof?", answers: [
    "Swapfiets — reliable is underrated",
    "VanMoof, even though it's bankrupt now",
    "My grandma's omafiets. Still going strong",
    "I just take the tram honestly",
  ]},
  { question: "Noord or Zuid?", answers: [
    "Noord. The ferry is half the charm",
    "Zuid. Vondelpark sunsets > everything",
    "Oost. Don't sleep on Oost",
    "Wherever the best flat white is",
  ]},
  { question: "IJhallen or Negen Straatjes?", answers: [
    "IJhallen — I found my favorite jacket there",
    "Negen Straatjes on a quiet Tuesday morning",
    "Both but I always spend too much at IJhallen",
    "Negen Straatjes. I like small shops with attitude",
  ]},
  { question: "What's your ideal Sunday?", answers: [
    "Coffee, book, canal. In that order",
    "Long bike ride ending at a terrace",
    "Sleep in, cook something elaborate, eat with friends",
    "Farmers market, then doing absolutely nothing",
    "Vondelpark with a podcast and an overpriced croissant",
  ]},
  { question: "Hot take about Amsterdam?", answers: [
    "The Jordaan is overrated and I will die on this hill",
    "Dutch pancakes > French crêpes. Fight me",
    "Museumplein is only good when it's empty",
    "Albert Cuyp markt has the best €3 lunch in the city",
    "The best coffee in Amsterdam is in Oost, not Centrum",
  ]},
  { question: "The last thing that made me laugh?", answers: [
    "My own joke that nobody else found funny",
    "A dog wearing a raincoat on a cargo bike",
    "Trying to explain 'gezellig' to a tourist",
    "My friend's dating app horror story",
    "A seagull stealing someone's broodje at Centraal",
  ]},
  { question: "I'm looking for someone who...", answers: [
    "doesn't check their phone during dinner",
    "can beat me at chess (or at least tries)",
    "has a Spotify playlist for every mood",
    "knows the difference between a cortado and a flat white",
    "would bike through the rain with me and still have fun",
  ]},
  { question: "A hill I'll die on?", answers: [
    "Oat milk is objectively the best milk alternative",
    "Tipping culture should not be a thing in Amsterdam",
    "Your Spotify Wrapped says more about you than your bio",
    "Terraces should be open year-round. Yes, even in January",
    "Everyone should own at least one houseplant",
  ]},
  { question: "My most controversial opinion?", answers: [
    "I think stroopwafels are mid",
    "Amsterdam is better in winter than summer",
    "Going to bed at 10pm is a flex, not a weakness",
    "Eating alone at a restaurant is elite behavior",
    "Heineken is fine. There, I said it",
  ]},
  { question: "Electric bike or normal bike?", answers: [
    "Normal. I have legs for a reason",
    "Electric. Life's too short for headwind",
    "Normal for summer, electric for everything else",
    "I walk. Controversial, I know",
  ]},
  { question: "Best spot in Amsterdam nobody knows about?", answers: [
    "That tiny café behind the Westerkerk with no sign",
    "The rooftop of NEMO at sunset. Free entrance",
    "Flevopark on a summer morning. It's just you and the ducks",
    "The reading room at OBA Centraal. Silence is golden",
    "The hidden garden behind the Begijnhof",
  ]},
  { question: "What I order on a first coffee?", answers: [
    "Whatever they recommend. I trust the barista",
    "Double espresso. Shows confidence, right?",
    "Oat flat white. I'm basic and I own it",
    "Whatever's longest to make so the conversation keeps going",
    "Chai latte. I know it's not coffee. I don't care",
  ]},
];

const SPOTIFY_SONGS = [
  "https://open.spotify.com/track/3yk7PJnryiJ8mAPqsrujzf", // Smalltown Boy
  "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3", // Shape of You
  "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights
  "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT", // Never Gonna Give You Up
  "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr", // Cruel Summer
  "",
  "",
];

// Stock photo URLs (Unsplash — free to use)
const PHOTO_URLS = {
  women: [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop",
  ],
  men: [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&h=800&fit=crop",
  ],
};

const BIOS = {
  women: [
    "Design nerd. Canal walker. Probably reading on a terrace somewhere.",
    "Recently moved from London. Still discovering Amsterdam one coffee at a time.",
    "Cycling everywhere, cooking for friends, and always down for a spontaneous terrace.",
    "Architecture student. Vintage lover. Ask me about my favorite canal house.",
    "Marketing by day, photography by weekend. Looking for someone to explore the city with.",
    "Yoga instructor. Plant collector. Believes the best conversations happen over coffee.",
    "Originally from Paris. Working in tech. My Dutch is terrible but my coffee taste is impeccable.",
    "Writer. Dog person. The kind who brings a book to a café and stays for hours.",
  ],
  men: [
    "Developer by day, DJ by night. Jordaan local. Always looking for the best espresso.",
    "New to Amsterdam. Creative director. Obsessed with specialty coffee and vintage bikes.",
    "Teacher. Runner. The guy who knows every café in De Pijp.",
    "Architect. Vinyl collector. Firm believer that a good flat white fixes everything.",
    "Photographer. Festival goer. Probably cycling past you right now.",
    "Just moved from Berlin. Working at a startup. Amsterdam feels like home already.",
    "Bartender (ironic for a coffee dating app). Film nerd. Reads actual books.",
    "Consultant. Climber. Looking for someone who doesn't take themselves too seriously.",
  ],
};

const FIRST_NAMES = {
  women: ["Emma", "Sophie", "Lisa", "Anna", "Julia", "Nina", "Fleur", "Lotte"],
  men: ["Thomas", "Daan", "Bram", "Lucas", "Jasper", "Max", "Finn", "Jesse"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomAge(): number {
  return 24 + Math.floor(Math.random() * 12); // 24-35
}

async function seed() {
  console.log("🌱 Seeding test profiles...\n");

  const profiles: { name: string; gender: string; uid: string }[] = [];

  // Create 8 women + 8 men = 16 profiles
  for (const gender of ["woman", "man"] as const) {
    const names = FIRST_NAMES[gender === "woman" ? "women" : "men"];
    const bios = BIOS[gender === "woman" ? "women" : "men"];
    const photos = PHOTO_URLS[gender === "woman" ? "women" : "men"];

    for (let i = 0; i < 8; i++) {
      const uid = `seed_${gender}_${i}`;
      const name = names[i];
      const age = randomAge();
      const neighborhood = pick(NEIGHBORHOODS);
      const interests = pickN(INTERESTS_POOL, 4 + Math.floor(Math.random() * 4));
      const coffeeOrder = pick(COFFEE_ORDERS);
      const bio = bios[i];
      const profileSong = pick(SPOTIFY_SONGS);
      const lookingFor = pick(["dating", "dating", "dating", "friends", "open"]);

      // Pick 3 random prompts with random answers
      const selectedPrompts = pickN(PROMPTS, 3).map((p) => ({
        question: p.question,
        answer: pick(p.answers),
      }));

      const userData = {
        uid,
        displayName: name,
        age,
        bio,
        photos: [photos[i]],
        neighborhood,
        interests,
        lookingFor,
        ...(profileSong ? { profileSong } : {}),
        coffeeOrder,
        prompts: selectedPrompts,
        gender,
        genderPreference: gender === "woman" ? ["men"] : ["women"],
        ageRange: [22, 40],
        dateTokens: 0,
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now(),
      };

      await db.collection("users").doc(uid).set(userData);
      profiles.push({ name, gender, uid });
      console.log(`  ✓ ${name}, ${age} (${gender}) — ${neighborhood}`);
    }
  }

  console.log(`\n✅ Created ${profiles.length} test profiles!`);
  console.log("\nUIDs:");
  profiles.forEach((p) => console.log(`  ${p.uid} — ${p.name} (${p.gender})`));

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
