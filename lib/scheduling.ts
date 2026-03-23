import {
  doc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { AMSTERDAM_CAFES } from "./cafes";
import type { Match } from "@/types";

/**
 * Find overlapping available time slots between two users.
 */
export function findOverlappingSlots(
  slotsA: string[],
  slotsB: string[]
): string[] {
  const setB = new Set(slotsB);
  return slotsA.filter((slot) => setB.has(slot));
}

/**
 * Pick the earliest overlapping slot.
 */
export function pickBestSlot(overlapping: string[]): string | null {
  if (overlapping.length === 0) return null;
  return overlapping.sort()[0];
}

/**
 * Generate available daytime slots for upcoming Fri/Sat/Sun only.
 * Slots: 9:00, 10:00, 11:00, 13:00, 14:00, 15:00
 * Looks ahead up to 14 days to find at least 2 weekends.
 */
export function generateAvailableSlots(fromDate: Date = new Date()): string[] {
  const hours = [9, 10, 11, 13, 14, 15];
  const weekendDays = [5, 6, 0]; // Friday, Saturday, Sunday
  const slots: string[] = [];

  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + dayOffset);

    if (!weekendDays.includes(date.getDay())) continue;

    for (const hour of hours) {
      const d = new Date(date);
      d.setHours(hour, 0, 0, 0);
      slots.push(d.toISOString());
    }
  }

  return slots;
}

/**
 * Submit a user's availability for a match.
 * If both users have submitted, find overlap and propose a date.
 */
export async function submitAvailability(
  matchId: string,
  uid: string,
  selectedSlots: string[]
): Promise<{ dateProposed: boolean; proposedSlot?: string }> {
  const matchRef = doc(db, "matches", matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error("Match not found");

  const match = { id: snap.id, ...snap.data() } as Match;
  const newAvailability = { ...match.availability, [uid]: selectedSlots };

  // Check if both users have submitted
  const otherUid = match.users.find((u) => u !== uid);
  if (!otherUid) throw new Error("Invalid match");

  const otherSlots = newAvailability[otherUid];

  if (otherSlots && otherSlots.length > 0) {
    // Both submitted — find overlap
    const overlapping = findOverlappingSlots(selectedSlots, otherSlots);
    const bestSlot = pickBestSlot(overlapping);

    if (bestSlot) {
      await updateDoc(matchRef, {
        availability: newAvailability,
        status: "date_proposed",
        proposedSlot: Timestamp.fromDate(new Date(bestSlot)),
      });
      return { dateProposed: true, proposedSlot: bestSlot };
    } else {
      // No overlap — save anyway, status stays scheduling
      await updateDoc(matchRef, { availability: newAvailability });
      return { dateProposed: false };
    }
  } else {
    // Only this user submitted — save and wait
    await updateDoc(matchRef, {
      availability: newAvailability,
      status: "scheduling",
    });
    return { dateProposed: false };
  }
}

/**
 * Pick a café based on two users' neighborhoods.
 * Finds cafés closest to the midpoint of both neighborhoods.
 */
export function pickCafé(
  neighborhoodA: string,
  neighborhoodB: string
): (typeof AMSTERDAM_CAFES)[number] {
  // If same neighborhood, pick a café in that neighborhood
  if (neighborhoodA === neighborhoodB) {
    const local = AMSTERDAM_CAFES.filter(
      (c) => c.neighborhood === neighborhoodA
    );
    if (local.length > 0) {
      return local[Math.floor(Math.random() * local.length)];
    }
  }

  // Otherwise pick a random café — in MVP we keep it simple
  // Later: calculate geographic midpoint and pick closest
  return AMSTERDAM_CAFES[Math.floor(Math.random() * AMSTERDAM_CAFES.length)];
}

/**
 * Confirm a proposed date — both users must confirm.
 * When both confirm, create a DateRecord.
 */
export async function confirmDate(
  matchId: string,
  uid: string,
  neighborhoodA: string,
  neighborhoodB: string
): Promise<{ fullyConfirmed: boolean; dateId?: string }> {
  const matchRef = doc(db, "matches", matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error("Match not found");

  const match = { id: snap.id, ...snap.data() } as Match;

  const confirmedBy = match.confirmedBy || [];
  if (confirmedBy.includes(uid)) {
    return { fullyConfirmed: confirmedBy.length >= 2 };
  }

  const newConfirmed = [...confirmedBy, uid];

  if (newConfirmed.length >= 2 && match.proposedSlot) {
    // Both confirmed — create DateRecord
    const café = pickCafé(neighborhoodA, neighborhoodB);
    const dateTime = match.proposedSlot;
    const chatOpenAt = Timestamp.fromDate(
      new Date(dateTime.toDate().getTime() - 2 * 60 * 60 * 1000)
    );

    const dateRef = await addDoc(collection(db, "dates"), {
      matchId,
      users: match.users,
      caféId: café.name,
      caféName: café.name,
      caféAddress: café.address,
      caféVibe: café.vibe,
      caféGoogleMapsUrl: café.googleMapsUrl,
      dateTime,
      chatOpenAt,
      status: "upcoming",
      messages: [],
      createdAt: serverTimestamp(),
    });

    await updateDoc(matchRef, {
      confirmedBy: newConfirmed,
      status: "date_confirmed",
      caféId: café.name,
      dateTime,
    });

    return { fullyConfirmed: true, dateId: dateRef.id };
  } else {
    await updateDoc(matchRef, { confirmedBy: newConfirmed });
    return { fullyConfirmed: false };
  }
}
