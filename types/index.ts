import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string;
  age: number;
  bio: string;
  photos: string[]; // Firebase Storage URLs, max 6
  neighborhood: string; // Amsterdam neighborhood
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
  createdAt: Timestamp;
  lastActive: Timestamp;
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
