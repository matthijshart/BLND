import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Check if two users have mutually liked each other.
 * Called after a new swipe is recorded.
 */
export async function checkForMatch(
  swiperId: string,
  swipedId: string
): Promise<boolean> {
  // Check if the swiped user has also liked the swiper
  const q = query(
    collection(db, "swipes"),
    where("swiperId", "==", swipedId),
    where("swipedId", "==", swiperId),
    where("direction", "==", "like")
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
