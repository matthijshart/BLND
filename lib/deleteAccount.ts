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
 * Firebase rejects deleteUser() with auth/requires-recent-login when the
 * session is older than a few minutes. Because the auth account must be
 * deleted LAST (the user loses permission to delete their own Firestore data
 * the moment it goes), hitting that error mid-run would leave the account
 * half-deleted: data gone, login still working. We check up front instead and
 * abort before touching anything.
 */
export class ReauthRequiredError extends Error {
  constructor() {
    super("Please sign out and sign in again, then delete your account.");
    this.name = "ReauthRequiredError";
  }
}

/** Firebase's own window is around 5 minutes; stay just inside it. */
const RECENT_LOGIN_MS = 4 * 60 * 1000;

/**
 * Recursively delete everything under a Storage folder.
 *
 * listAll() is NOT recursive: it returns files at one level in `items` and
 * subfolders in `prefixes`. Photos live at users/{uid}/photos/{n}.jpg, so
 * listing users/{uid} yields an empty `items` array and one prefix — which is
 * why iterating `items` alone deleted nothing at all.
 */
async function deleteFolderRecursive(
  folder: ReturnType<typeof ref>
): Promise<void> {
  const listing = await listAll(folder);
  await Promise.all([
    ...listing.items.map((item) =>
      deleteObject(item).catch(() => {
        // One failed file shouldn't abort the whole deletion
      })
    ),
    ...listing.prefixes.map((sub) => deleteFolderRecursive(sub)),
  ]);
}

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
  // Pre-flight: refuse to start unless the auth account can actually be
  // deleted at the end. Without this the run destroys every document first and
  // only then discovers it cannot remove the login.
  const preUser = auth.currentUser;
  if (preUser && preUser.uid === uid) {
    const lastSignIn = preUser.metadata.lastSignInTime;
    const age = lastSignIn ? Date.now() - new Date(lastSignIn).getTime() : Infinity;
    if (!Number.isFinite(age) || age > RECENT_LOGIN_MS) {
      throw new ReauthRequiredError();
    }
  }

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
    await deleteFolderRecursive(ref(storage, `users/${uid}`));
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
