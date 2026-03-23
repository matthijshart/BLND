/**
 * BLEND profile prompts — yuppie Amsterdam edition
 * Users pick 2-3 and answer them
 */

export interface ProfilePromptConfig {
  id: string;
  question: string;
  type: "choice" | "open";
  options?: [string, string]; // for "this or that" style
}

export const PROFILE_PROMPTS: ProfilePromptConfig[] = [
  // This or that
  {
    id: "bike",
    question: "Swapfiets or VanMoof?",
    type: "choice",
    options: ["Swapfiets", "VanMoof"],
  },
  {
    id: "ebike",
    question: "Electric bike or normal bike?",
    type: "choice",
    options: ["Electric", "Normal"],
  },
  {
    id: "market",
    question: "IJhallen or Noordermarkt?",
    type: "choice",
    options: ["IJhallen", "Noordermarkt"],
  },
  {
    id: "shopping",
    question: "Negen Straatjes or De Pijp?",
    type: "choice",
    options: ["Negen Straatjes", "De Pijp"],
  },
  {
    id: "compass",
    question: "Noord, Zuid, Oost, or West?",
    type: "choice",
    options: ["Noord", "Oost"],
  },
  {
    id: "morning",
    question: "Morning person or night owl?",
    type: "choice",
    options: ["Morning person", "Night owl"],
  },
  {
    id: "park",
    question: "Vondelpark or Westerpark?",
    type: "choice",
    options: ["Vondelpark", "Westerpark"],
  },
  {
    id: "weekend",
    question: "Terrace in the sun or cozy café inside?",
    type: "choice",
    options: ["Terrace", "Inside"],
  },
  {
    id: "food",
    question: "Foodhallen or Albert Cuyp?",
    type: "choice",
    options: ["Foodhallen", "Albert Cuyp"],
  },
  {
    id: "ferry",
    question: "Ferry to Noord or tram to Zuid?",
    type: "choice",
    options: ["Ferry to Noord", "Tram to Zuid"],
  },
  {
    id: "brunch",
    question: "€18 avocado toast or €3 tosti from the snackbar?",
    type: "choice",
    options: ["Avocado toast", "Snackbar tosti"],
  },
  {
    id: "rain",
    question: "Rain jacket or just accept being wet?",
    type: "choice",
    options: ["Rain jacket", "Accept it"],
  },
  {
    id: "oat",
    question: "Oat milk surcharge or just drink it black?",
    type: "choice",
    options: ["Pay the surcharge", "Black coffee"],
  },
  {
    id: "canal",
    question: "Swim in the canals: yes or absolutely not?",
    type: "choice",
    options: ["Yes obviously", "Absolutely not"],
  },
  {
    id: "apartment",
    question: "Tiny apartment with canal view or spacious place in Nieuw-West?",
    type: "choice",
    options: ["Tiny + canal view", "Spacious Nieuw-West"],
  },
  {
    id: "borrel",
    question: "Friday borrel or Friday night in?",
    type: "choice",
    options: ["Borrel", "Night in"],
  },
  // Open questions
  {
    id: "controversial",
    question: "Your most controversial Amsterdam opinion?",
    type: "open",
  },
  {
    id: "tourist",
    question: "The most tourist thing you secretly enjoy?",
    type: "open",
  },
  {
    id: "hidden_gem",
    question: "A hidden gem in Amsterdam nobody knows about?",
    type: "open",
  },
  {
    id: "sunday",
    question: "Your perfect Amsterdam Sunday looks like...",
    type: "open",
  },
  {
    id: "deal_breaker",
    question: "Coffee dealbreaker?",
    type: "open",
  },
  {
    id: "first_date",
    question: "Best first date spot in Amsterdam?",
    type: "open",
  },
];
