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
 * Generate available daytime slots for the next 7 days.
 * Slots: 9-10, 10-11, 11-12, 13-14, 14-15, 15-16
 */
export function generateAvailableSlots(fromDate: Date = new Date()): string[] {
  const hours = [9, 10, 11, 13, 14, 15];
  const slots: string[] = [];

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + dayOffset);

    for (const hour of hours) {
      date.setHours(hour, 0, 0, 0);
      slots.push(date.toISOString());
    }
  }

  return slots;
}
