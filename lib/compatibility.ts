import type { User } from "@/types";

/**
 * Calculate vibe match percentage based on overlapping interests and prompts.
 * Returns 0-100.
 */
export function calculateVibeMatch(userA: User, userB: User): number {
  let score = 0;
  let maxScore = 0;

  // Interest overlap (worth 60%)
  const interestsA = new Set(userA.interests || []);
  const interestsB = new Set(userB.interests || []);
  const totalInterests = new Set([...interestsA, ...interestsB]).size;

  if (totalInterests > 0) {
    const overlap = [...interestsA].filter((i) => interestsB.has(i)).length;
    score += (overlap / totalInterests) * 60;
  }
  maxScore += 60;

  // Prompt overlap — same dilemma answers (worth 25%)
  const promptsA = userA.prompts || [];
  const promptsB = userB.prompts || [];

  if (promptsA.length > 0 && promptsB.length > 0) {
    let promptMatches = 0;
    let promptComparisons = 0;

    for (const pA of promptsA) {
      const matching = promptsB.find((pB) => pB.question === pA.question);
      if (matching) {
        promptComparisons++;
        // Check if choice answers are similar (for choice prompts, extract first word/option)
        const choiceA = pA.answer.split("—")[0].trim().toLowerCase();
        const choiceB = matching.answer.split("—")[0].trim().toLowerCase();
        if (choiceA === choiceB) {
          promptMatches++;
        }
      }
    }

    if (promptComparisons > 0) {
      score += (promptMatches / promptComparisons) * 25;
    }
  }
  maxScore += 25;

  // Looking for same thing (worth 15%)
  if (userA.lookingFor && userB.lookingFor) {
    if (userA.lookingFor === userB.lookingFor) {
      score += 15;
    } else if (userA.lookingFor === "open" || userB.lookingFor === "open") {
      score += 8;
    }
  }
  maxScore += 15;

  // Normalize and add a base of 40% so nobody gets a depressingly low score
  const raw = maxScore > 0 ? (score / maxScore) * 100 : 50;
  const adjusted = Math.round(40 + raw * 0.55); // Range: 40-95%
  return Math.min(95, Math.max(40, adjusted));
}

/**
 * Coffee compatibility — fun score + message based on coffee orders.
 */
export function getCoffeeCompatibility(
  orderA?: string,
  orderB?: string
): { score: number; message: string } {
  if (!orderA || !orderB) {
    return { score: 0, message: "" };
  }

  const a = orderA.toLowerCase();
  const b = orderB.toLowerCase();

  // Exact same order
  if (a === b) {
    return { score: 100, message: "Same order. Soulmates confirmed." };
  }

  // Both oat milk
  if (a.includes("oat") && b.includes("oat")) {
    return { score: 92, message: "Both oat milk people. This is going somewhere." };
  }

  // Both espresso/black
  if (
    (a.includes("espresso") || a.includes("black")) &&
    (b.includes("espresso") || b.includes("black"))
  ) {
    return { score: 95, message: "Two espresso people. No nonsense. We like it." };
  }

  // Both flat white
  if (a.includes("flat white") && b.includes("flat white")) {
    return { score: 90, message: "Flat white duo. Obviously compatible." };
  }

  // Both latte
  if (a.includes("latte") && b.includes("latte")) {
    return { score: 85, message: "Latte lovers unite." };
  }

  // Both cappuccino
  if (a.includes("cappuccino") && b.includes("cappuccino")) {
    return { score: 85, message: "Classic cappuccino energy. Reliable." };
  }

  // Espresso vs frappuccino — opposites
  if (
    (a.includes("espresso") && b.includes("frappuccino")) ||
    (a.includes("frappuccino") && b.includes("espresso"))
  ) {
    return { score: 45, message: "Opposites attract... apparently." };
  }

  // Tea vs coffee
  if (
    (a.includes("tea") && !b.includes("tea")) ||
    (!a.includes("tea") && b.includes("tea"))
  ) {
    return { score: 50, message: "One tea, one coffee. This could go either way." };
  }

  // Both have milk-based drinks
  const milkWords = ["latte", "cappuccino", "flat white", "cortado", "macchiato", "oat", "milk"];
  const aIsMilky = milkWords.some((w) => a.includes(w));
  const bIsMilky = milkWords.some((w) => b.includes(w));

  if (aIsMilky && bIsMilky) {
    return { score: 75, message: "Both milk-based. Good foundation." };
  }

  if (!aIsMilky && !bIsMilky) {
    return { score: 78, message: "Both keep it simple. Respect." };
  }

  // Default — some overlap
  return { score: 65, message: "Different orders, same table. That's what counts." };
}
