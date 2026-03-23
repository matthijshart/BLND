import type { User } from "@/types";

/**
 * Calculate a "vibe match" percentage between two users.
 * Returns a number between 45–98 (never 100% or below 40%).
 */
export function calculateVibeMatch(userA: User, userB: User): number {
  let score = 0;
  let maxScore = 0;

  // --- Shared interests (biggest weight: up to 40 points) ---
  const interestsA = new Set(userA.interests || []);
  const interestsB = new Set(userB.interests || []);
  const allInterests = new Set([...interestsA, ...interestsB]);

  if (allInterests.size > 0) {
    const shared = [...interestsA].filter((i) => interestsB.has(i)).length;
    score += (shared / allInterests.size) * 40;
  }
  maxScore += 40;

  // --- Same neighborhood (bonus: 15 points) ---
  if (
    userA.neighborhood &&
    userB.neighborhood &&
    userA.neighborhood.toLowerCase() === userB.neighborhood.toLowerCase()
  ) {
    score += 15;
  }
  maxScore += 15;

  // --- Similar prompt answers (up to 20 points) ---
  // Check "this or that" style: if both answered the same question, see if they picked the same option
  const promptsA = userA.prompts || [];
  const promptsB = userB.prompts || [];

  if (promptsA.length > 0 && promptsB.length > 0) {
    const promptMapB = new Map(promptsB.map((p) => [p.question.toLowerCase(), p.answer.toLowerCase()]));
    let matchedQuestions = 0;
    let sameAnswers = 0;

    for (const p of promptsA) {
      const bAnswer = promptMapB.get(p.question.toLowerCase());
      if (bAnswer !== undefined) {
        matchedQuestions++;
        if (bAnswer === p.answer.toLowerCase()) {
          sameAnswers++;
        }
      }
    }

    if (matchedQuestions > 0) {
      score += (sameAnswers / matchedQuestions) * 20;
    }
  }
  maxScore += 20;

  // --- Both have a profile song (small bonus: 10 points) ---
  if (userA.profileSong && userB.profileSong) {
    score += 10;
  }
  maxScore += 10;

  // --- Same lookingFor value (bonus: 15 points) ---
  if (userA.lookingFor && userB.lookingFor && userA.lookingFor === userB.lookingFor) {
    score += 15;
  }
  maxScore += 15;

  // Normalize to 0–1 range
  const raw = maxScore > 0 ? score / maxScore : 0;

  // Map to 45–98 range so it always feels natural
  const percentage = Math.round(45 + raw * 53);

  return Math.min(98, Math.max(45, percentage));
}
