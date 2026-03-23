const MILK_BASED = ["latte", "flat white", "cappuccino", "oat"];
const BLACK = ["espresso", "americano", "black", "filter"];
const FANCY = ["cortado", "flat white", "pour over"];
const NON_COFFEE = ["chai", "matcha"];

function normalize(order: string): string {
  return order.toLowerCase().trim();
}

function hasKeyword(order: string, keywords: string[]): boolean {
  return keywords.some((kw) => order.includes(kw));
}

/**
 * Returns a fun compatibility message based on two coffee orders.
 */
export function getCoffeeCompatibility(orderA: string, orderB: string): string {
  const a = normalize(orderA);
  const b = normalize(orderB);

  // Same exact order
  if (a === b) {
    return "Soulmates. Same order, same vibe.";
  }

  const aIsMilk = hasKeyword(a, MILK_BASED);
  const bIsMilk = hasKeyword(b, MILK_BASED);
  const aIsBlack = hasKeyword(a, BLACK);
  const bIsBlack = hasKeyword(b, BLACK);
  const aIsFancy = hasKeyword(a, FANCY);
  const bIsFancy = hasKeyword(b, FANCY);
  const aIsNonCoffee = hasKeyword(a, NON_COFFEE);
  const bIsNonCoffee = hasKeyword(b, NON_COFFEE);

  // One coffee, one non-coffee
  if ((aIsNonCoffee && !bIsNonCoffee) || (bIsNonCoffee && !aIsNonCoffee)) {
    return "One caffeinated, one enlightened.";
  }

  // Both fancy
  if (aIsFancy && bIsFancy) {
    return "Coffee snobs unite.";
  }

  // Both black
  if (aIsBlack && bIsBlack) {
    return "Two black coffee people. No nonsense.";
  }

  // Both milk-based
  if (aIsMilk && bIsMilk) {
    return "Both milk people. This could work.";
  }

  // One black, one milk
  if ((aIsBlack && bIsMilk) || (bIsBlack && aIsMilk)) {
    return "Opposites attract. One sweet, one strong.";
  }

  return "Different cups, same table.";
}
