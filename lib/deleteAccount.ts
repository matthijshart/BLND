import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { deleteObject, ref, listAll } from "firebase/storage";
import { deleteUser } from "firebase/auth";
import { db, storage, auth } from "./firebase";

const FIRESTORE_BATCH_LIMIT = 500;

/**
 * Delete documents in batches of 500 (Firestore's hard limit per batch).
 */
async function deleteInChunks(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = refs.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

/**
 * Permanently delete a user's account and all associated data.
 *
 * Deletes:
 * - /users/{uid} profile doc
 * - /users/{uid}/dailyProfiles/* subcollection
 * - /swipes where swiperId == uid OR swipedId == uid
 * - /matches where users contains uid
 * - /dates where users contains uid (includes inline messages)
 * - All photos in Storage under /users/{uid}/
 * - Firebase Auth account
 *
 * Chat messages are stored inline on date documents (no separate collection),
 * so deleting dates removes all messages the user participated in.
 *
 * Robust to Firestore's 500-write batch limit via chunking.
 */
export async function deleteAccount(uid: string): Promise<void> {
  const toDelete: DocumentReference[] = [];

  // 1. Profile doc
  toDelete.push(doc(db, "users", uid));

  // 2. Daily profiles subcollection
  const dailySnap = await getDocs(
    collection(db, "users", uid, "dailyProfiles")
  );
  dailySnap.docs.forEach((d) => toDelete.push(d.ref));

  // 3. Swipes by this user
  const swipesSnap = await getDocs(
    query(collection(db, "swipes"), where("swiperId", "==", uid))
  );
  swipesSnap.docs.forEach((d) => toDelete.push(d.ref));

  // 4. Swipes targeting this user
  const swipedSnap = await getDocs(
    query(collection(db, "swipes"), where("swipedId", "==", uid))
  );
  swipedSnap.docs.forEach((d) => toDelete.push(d.ref));

  // 5. Matches involving this user
  const matchesSnap = await getDocs(
    query(collection(db, "matches"), where("users", "array-contains", uid))
  );
  matchesSnap.docs.forEach((d) => toDelete.push(d.ref));

  // 6. Dates involving this user (messages are inline on these docs)
  const datesSnap = await getDocs(
    query(collection(db, "dates"), where("users", "array-contains", uid))
  );
  datesSnap.docs.forEach((d) => toDelete.push(d.ref));

  // Commit in 500-doc chunks
  await deleteInChunks(toDelete);

  // 7. Delete all photos from Storage
  try {
    const storageRef = ref(storage, `users/${uid}`);
    const fileList = await listAll(storageRef);
    await Promise.all(
      fileList.items.map((item) =>
        deleteObject(item).catch(() => {
          // Single file delete fail shouldn't abort the whole deletion
        })
      )
    );
  } catch {
    // Storage folder might not exist — that's fine
  }

  // 8. Clear any client-side drafts
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("blend_onboarding_draft");
      localStorage.removeItem("blend_welcomed");
    }
  } catch {
    // ignore
  }

  // 9. Delete Firebase Auth account (must be last — after this,
  // the user loses permission to delete their own data)
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === uid) {
    await deleteUser(currentUser);
  }
}
