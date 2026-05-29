/**
 * Seeds 20 test profiles with the FULL new schema (height, languages,
 * hometown, work, company, education, dateOfBirth) so Matthijs can
 * test swiping and the matching pipeline against realistic data.
 *
 * Half of them pre-like Matthijs so a like back creates an instant
 * mutual match — useful for testing the meet-planning flow without
 * waiting for organic matches.
 *
 * Run:
 *   npx tsx scripts/seed-test-batch.ts
 *
 * Set TARGET_EMAIL below to whoever you're testing as. Default is
 * matthijsthart4@gmail.com.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
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

const NEIGHBORHOOD = "Amsterdam";

const INTERESTS_POOL = [
  "specialty coffee", "cycling", "art", "vinyl", "reading", "yoga",
  "cooking", "live music", "running", "photography", "design", "travel",
  "natural wine", "cinema", "museums", "climbing", "festivals", "podcasts",
  "tennis", "padel", "football", "surfing", "skating", "pottery",
  "vondelpark mornings", "albert cuyp", "noord ferries",
];

const COFFEE_ORDERS = [
  "Cortado, always",
  "Iced oat latte",
  "Single origin V60",
  "Flat white, no sugar",
  "Matcha, ceremonial",
  "Cappuccino, dark",
  "Filter, black",
  "Espresso macchiato",
  "Long black, cold",
  "Chai latte, with cardamom",
];

const PROMPTS = [
  { question: "Swapfiets or VanMoof?", answers: ["Swapfiets", "VanMoof"] },
  { question: "Terrace or café?", answers: ["Terrace", "Café"] },
  { question: "Morning person or night owl?", answers: ["Morning person", "Night owl"] },
  { question: "Negen Straatjes or De Pijp?", answers: ["Negen Straatjes", "De Pijp"] },
  { question: "IJhallen or Noordermarkt?", answers: ["IJhallen", "Noordermarkt"] },
  { question: "Electric bike or normal bike?", answers: ["Electric", "Normal"] },
  {
    question: "A hill I'll die on?",
    answers: [
      "Oat milk is the only milk alternative",
      "Tipping shouldn't be a culture in Amsterdam",
      "Brown cafés > specialty coffee",
      "Always cycle in the rain",
    ],
  },
  {
    question: "Sunday plans?",
    answers: [
      "Slow bike through Amstelpark",
      "Foam exhibition then natural wine",
      "Albert Cuyp + a long brunch",
      "Vondelpark with a book, no phone",
    ],
  },
];

const SPOTIFY_SONGS = [
  "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv",
  "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
  "https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3",
  "https://open.spotify.com/track/1zi7xx7UVEFkmKfv06H8x0",
];

interface SeedProfile {
  name: string;
  gender: "man" | "woman";
  age: number;
  hometown: string;
  heightCm: number;
  languages: string[];
  work: string;
  company?: string;
  education?: string;
  bio: string;
  photo: string;
  /** If true, this profile pre-likes the target so a like-back creates a match. */
  preLikes: boolean;
}

const TEST_PROFILES: SeedProfile[] = [
  // ── Women (10) — varied origins, work, height
  { name: "Anouk", gender: "woman", age: 27, hometown: "Utrecht", heightCm: 172, languages: ["Dutch", "English", "French"], work: "Product designer", company: "Catawiki", education: "TU Delft", bio: "Two flat whites in. Sunday is sacred. Anyone who beats me at Wordle is a friend.", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop", preLikes: true },
  { name: "Sofia", gender: "woman", age: 30, hometown: "Madrid", heightCm: 168, languages: ["Spanish", "English", "Italian", "Portuguese"], work: "Architect", company: "MVRDV", bio: "Spaniard who learnt the rain. Will explain why Negen Straatjes is overrated.", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop", preLikes: true },
  { name: "Eva", gender: "woman", age: 26, hometown: "Antwerp", heightCm: 175, languages: ["Dutch", "English", "French"], work: "Copywriter", company: "Wieden+Kennedy", education: "KU Leuven", bio: "Wrote the brief, lost the brief. Looking for someone who can keep a conversation going past the second espresso.", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop", preLikes: true },
  { name: "Ines", gender: "woman", age: 33, hometown: "Lisbon", heightCm: 165, languages: ["Portuguese", "English", "Spanish"], work: "Senior UX researcher", company: "Booking.com", education: "University of Porto", bio: "Three coffees a day, minimum. Will recommend the best pastel de nata in Amsterdam (it's in Zuid).", photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop", preLikes: false },
  { name: "Lotte", gender: "woman", age: 28, hometown: "Groningen", heightCm: 178, languages: ["Dutch", "English", "German"], work: "PhD candidate (neuroscience)", company: "UvA", education: "Erasmus University", bio: "Studies dopamine. Mostly drinks it.", photo: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=600&h=800&fit=crop", preLikes: true },
  { name: "Marta", gender: "woman", age: 31, hometown: "Warsaw", heightCm: 170, languages: ["Polish", "English", "German"], work: "Brand strategist", company: "ING", bio: "Moved here for a six-month contract in 2021. Still here. Bike got stolen twice — feels Dutch now.", photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=800&fit=crop", preLikes: false },
  { name: "Yara", gender: "woman", age: 29, hometown: "Beirut", heightCm: 163, languages: ["Arabic", "English", "French"], work: "Film editor", education: "Netherlands Film Academy", bio: "Sad cinema, good wine, terrible at small talk. Try me with a real question.", photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop", preLikes: true },
  { name: "Sanne", gender: "woman", age: 25, hometown: "Eindhoven", heightCm: 169, languages: ["Dutch", "English"], work: "Junior associate", company: "De Brauw", education: "VU Amsterdam", bio: "Lawyer by day, baker by weekend. The cinnamon buns are non-negotiable.", photo: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop", preLikes: false },
  { name: "Camille", gender: "woman", age: 32, hometown: "Paris", heightCm: 167, languages: ["French", "English", "Dutch"], work: "Founder", company: "small fashion label", education: "ESSEC", bio: "Left fashion in Paris for a smaller studio here. Smaller is bigger.", photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop", preLikes: true },
  { name: "Niamh", gender: "woman", age: 27, hometown: "Dublin", heightCm: 174, languages: ["English", "Irish"], work: "Data analyst", company: "Adyen", bio: "Irish, so the rain is fine. Long walks, longer dinners. Big tea drinker — make of that what you will.", photo: "https://images.unsplash.com/photo-1554384645-13eab165c24b?w=600&h=800&fit=crop", preLikes: false },

  // ── Men (10) — same variety
  { name: "Daan", gender: "man", age: 29, hometown: "Den Haag", heightCm: 184, languages: ["Dutch", "English", "German"], work: "Engineer", company: "Bunq", education: "TU Delft", bio: "Half my coffee budget is for beans I'll never use. Looking for someone who'll laugh at that.", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop", preLikes: true },
  { name: "Lars", gender: "man", age: 32, hometown: "Stockholm", heightCm: 188, languages: ["Swedish", "English", "Dutch"], work: "Creative director", company: "&Co", bio: "Tall, quiet, expensive jacket. Will out-sit you on a terrace.", photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop", preLikes: true },
  { name: "Hugo", gender: "man", age: 28, hometown: "Barcelona", heightCm: 181, languages: ["Spanish", "Catalan", "English"], work: "Game designer", company: "Guerrilla Games", education: "UPF Barcelona", bio: "Catalan in cold weather. Trying to learn Dutch by ordering coffee. It's not working.", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop", preLikes: true },
  { name: "Bram", gender: "man", age: 31, hometown: "Maastricht", heightCm: 178, languages: ["Dutch", "English", "French"], work: "Investment associate", company: "Prosus", education: "Erasmus University", bio: "Finance during the week, films on the weekend. Eye on Rialto, hand on a flat white.", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop", preLikes: false },
  { name: "Tomás", gender: "man", age: 30, hometown: "Buenos Aires", heightCm: 176, languages: ["Spanish", "English", "Italian"], work: "Restaurant owner", company: "small natural wine spot", bio: "I run the place that probably poured your last orange wine. Coffee in the morning, wine at night, never the other way.", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop", preLikes: true },
  { name: "Friso", gender: "man", age: 27, hometown: "Almere", heightCm: 182, languages: ["Dutch", "English"], work: "Climbing coach", company: "Klimhal Amsterdam", bio: "If you've never tried climbing, I'll fix that. If you have, prove it.", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop", preLikes: false },
  { name: "Kasper", gender: "man", age: 34, hometown: "Aarhus", heightCm: 186, languages: ["Danish", "English", "Dutch", "German"], work: "Architect", company: "OMA", education: "Aarhus School of Architecture", bio: "Designs buildings. Lives in a flat with too many plants.", photo: "https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=600&h=800&fit=crop", preLikes: true },
  { name: "Roald", gender: "man", age: 26, hometown: "Bergen", heightCm: 179, languages: ["Norwegian", "English"], work: "Photographer", bio: "Half of my Instagram is hands holding mugs. The other half is bridges. Sorry.", photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop", preLikes: false },
  { name: "Ravi", gender: "man", age: 33, hometown: "Mumbai", heightCm: 174, languages: ["Hindi", "English", "Dutch"], work: "Product manager", company: "Adyen", education: "IIT Bombay", bio: "Ten years in Amsterdam. Still hunting for the city's best masala chai. Suggestions welcome.", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=800&fit=crop", preLikes: true },
  { name: "Joris", gender: "man", age: 29, hometown: "Rotterdam", heightCm: 185, languages: ["Dutch", "English"], work: "Café owner", company: "Pluk Negen Straatjes", bio: "I'll spot you a coffee. I just want to hear what kind of week you're having.", photo: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=600&h=800&fit=crop", preLikes: false },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Compute a YYYY-MM-DD DOB for someone of the given age. */
function ageToDob(age: number): string {
  const now = new Date();
  const year = now.getFullYear() - age;
  // Random day in the year so they're not all on Jan 1
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function run() {
  console.log(`🌱 Seeding 20 test profiles (target user: ${TARGET_EMAIL})…\n`);

  let targetUid: string | null = null;
  try {
    const targetUser = await auth.getUserByEmail(TARGET_EMAIL);
    targetUid = targetUser.uid;
    console.log(`✓ Found target user — pre-likes will go to UID ${targetUid}\n`);
  } catch {
    console.log(`⚠ Target user not found in Auth — skipping pre-likes.\n`);
  }

  const today = new Date();
  const yyyymmdd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (let i = 0; i < TEST_PROFILES.length; i++) {
    const p = TEST_PROFILES[i];
    const uid = `seed_test_${p.gender}_${i}`;
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
      dateOfBirth: ageToDob(p.age),
      bio: p.bio,
      photos: [p.photo],
      neighborhood: NEIGHBORHOOD,
      hometown: p.hometown,
      heightCm: p.heightCm,
      languages: p.languages,
      work: p.work,
      interests,
      lookingFor: pick(["dating", "dating", "dating", "open"]),
      coffeeOrder,
      prompts: selectedPrompts,
      gender: p.gender,
      genderPreference: p.gender === "woman" ? ["men"] : ["women"],
      ageRange: [22, 42],
      dateTokens: 0,
      profileSong: song,
      verificationStatus: i < 10 ? "verified" : "unverified",
      createdAt: Timestamp.now(),
      lastActive: Timestamp.now(),
    };
    if (p.company) data.company = p.company;
    if (p.education) data.education = p.education;

    await db.collection("users").doc(uid).set(data);

    // Pre-like the target user from selected profiles
    if (p.preLikes && targetUid) {
      const swipeId = `${uid}_${targetUid}`;
      await db.collection("swipes").doc(swipeId).set({
        swiperId: uid,
        swipedId: targetUid,
        direction: "like",
        date: yyyymmdd,
        createdAt: Timestamp.now(),
      });
    }

    const marker = p.preLikes && targetUid ? "💛" : "  ";
    console.log(`  ${marker} ${p.name}, ${p.age} — ${p.hometown} → ${p.work}`);
  }

  console.log(
    `\n✅ Done. 20 profiles added. ${TEST_PROFILES.filter((p) => p.preLikes).length} of them pre-liked your account.`
  );
  console.log("Like them back from /today and you'll get instant matches.\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
