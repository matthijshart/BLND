import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string;
  age: number;
  /** ISO date string YYYY-MM-DD. Source of truth; `age` is derived. */
  dateOfBirth?: string;
  bio: string;
  photos: string[]; // Firebase Storage URLs, max 6. photos[0] is always the main/hero photo.
  neighborhood: string; // Amsterdam neighborhood — "Lives in"
  /** "Comes from" — hometown or country of origin. Important for expats. */
  hometown?: string;
  /** Height in centimeters. Required at onboarding. */
  heightCm?: number;
  /** Languages spoken — required at onboarding. ISO-ish codes / display names. */
  languages?: string[];
  /** Optional career/education fields */
  work?: string;
  company?: string;
  education?: string;
  interests: string[]; // tags: "specialty coffee", "cycling", "art", etc.
  lookingFor: "dating" | "friends" | "open";
  profilePrompt?: string; // answer to a fun question
  profileSong?: string; // Spotify track URL
  coffeeOrder?: string; // their go-to coffee order
  prompts?: { question: string; answer: string }[]; // fun prompt Q&As
  gender: string;
  genderPreference: string[];
  ageRange: [number, number];
  dateTokens: number;
  freezeUntil?: Timestamp;
  /** UIDs this user has blocked. Blocked users never see each other. */
  blockedUsers?: string[];
  /**
   * Photo verification status.
   * - `unverified` (default) — user hasn't submitted yet
   * - `pending` — selfie submitted, awaiting admin review
   * - `verified` — confirmed real, shows blue checkmark
   * - `rejected` — selfie didn't match, user can retry
   */
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected";
  verificationSubmittedAt?: Timestamp;
  /** Random pose challenge that was issued — keeps selfies hard to fake. */
  verificationPose?: "peace" | "thumbs_up" | "call_me";
  createdAt: Timestamp;
  lastActive: Timestamp;
}

export type ReportReason =
  | "inappropriate_photos"
  | "fake_profile"
  | "harassment"
  | "minor" // suspected under 18
  | "spam"
  | "other";

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  context: "today" | "blend" | "meet" | "chat" | "profile";
  notes?: string;
  resolved?: boolean;
  createdAt: Timestamp;
}

export interface DailyProfile {
  date: string; // "2026-03-23"
  profiles: string[]; // UIDs of shown profiles
  liked: string[];
  passed: string[];
  completedAt?: Timestamp;
}

export interface Swipe {
  id: string;
  swiperId: string;
  swipedId: string;
  direction: "like" | "pass";
  date: string; // which daily batch this came from
  createdAt: Timestamp;
}

export interface Match {
  id: string;
  users: [string, string];
  status:
    | "scheduling"
    | "date_proposed"
    | "date_confirmed"
    | "completed"
    | "expired"
    | "cancelled"
    | "second_cup";
  availability: {
    [uid: string]: string[]; // array of ISO datetime slots
  };
  proposedSlot?: Timestamp;
  confirmedBy: string[];
  caféId?: string;
  dateTime?: Timestamp;
  createdAt: Timestamp;
  expiresAt: Timestamp; // 3 days after match creation
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
}

export interface DateRecord {
  id: string;
  matchId: string;
  users: [string, string];
  caféId: string;
  dateTime: Timestamp;
  status: "upcoming" | "chat_open" | "completed" | "cancelled" | "no_show" | "second_cup";
  chatOpenAt: Timestamp; // 2 hours before dateTime
  messages: Message[];
  ratings?: {
    [uid: string]: {
      rating: 1 | 2 | 3 | 4 | 5;
      shareContact: boolean;
      contactInfo?: string;
    };
  };
}

export interface Café {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  coordinates: { lat: number; lng: number };
  vibe: string; // "cozy", "specialty", "terrace", "minimalist"
  photo: string;
  googleMapsUrl: string;
  partnered: boolean;
  capacity: number;
}

export interface WaitlistEntry {
  email: string;
  city: string;
  createdAt: Timestamp;
  source?: string;
}
