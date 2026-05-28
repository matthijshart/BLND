/**
 * BLEND user-display helpers — pure functions, no Firebase deps.
 */

/**
 * Stable, anonymous profile number derived from the UID.
 *
 * We don't want to expose internal counters or join order, but a small,
 * stable identifier next to a name ("Maya, 28 · #00742") feels official
 * without revealing real personal data.
 *
 * Implementation: hash-fold UID → 5-digit decimal. Same UID always
 * produces the same number; collisions are rare enough at <100k users.
 */
export function getProfileNumber(uid: string): string {
  if (!uid) return "#00000";
  let h = 0;
  for (let i = 0; i < uid.length; i++) {
    h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  }
  const n = h % 99999;
  return `#${n.toString().padStart(5, "0")}`;
}

/**
 * Languages BLEND surfaces in the onboarding picker.
 *
 * Ordered for Amsterdam-relevance: Dutch + English first (locals + expats),
 * then the rest by global speaker count. Keep the list short — too many
 * options paralyses people. ~25 is the sweet spot for dating onboarding.
 */
export const LANGUAGES = [
  "Dutch",
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Arabic",
  "Mandarin",
  "Cantonese",
  "Japanese",
  "Korean",
  "Hindi",
  "Russian",
  "Turkish",
  "Polish",
  "Ukrainian",
  "Greek",
  "Swedish",
  "Danish",
  "Norwegian",
  "Hebrew",
  "Farsi",
  "Indonesian",
  "Vietnamese",
] as const;

/**
 * Format height in cm to a human-friendly string.
 * 175 → "1.75 m"
 */
export function formatHeight(cm: number | undefined | null): string {
  if (!cm || cm < 100 || cm > 250) return "";
  const m = (cm / 100).toFixed(2);
  return `${m} m`;
}

/** Bounds for the height input in onboarding/edit. */
export const HEIGHT_MIN_CM = 140;
export const HEIGHT_MAX_CM = 220;
