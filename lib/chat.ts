import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Message } from "@/types";

/**
 * Send a message in a date's chat.
 * Messages are stored as a subcollection: dates/{dateId}/messages
 */
export async function sendMessage(
  dateId: string,
  senderId: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "dates", dateId, "messages"), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}

/**
 * Subscribe to real-time messages for a date.
 */
export function subscribeToMessages(
  dateId: string,
  callback: (messages: Message[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "dates", dateId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    callback(messages);
  });
}
