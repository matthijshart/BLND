import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref, listAll } from "firebase/storage";
import { deleteUser } from "firebase/auth";
import { db, storage, auth } from "./firebase";

/**
 * Permanently delete a user's account and all associated data.
 * This includes: profile, photos, swipes, matches, dates, daily profiles.
 */
export async function deleteAccount(uid: string): Promise<void> {
  const batch = writeBatch(db);

  // 1. Delete user profile
  batch.delete(doc(db, "users", uid));

  // 2. Delete daily profiles subcollection
  const dailySnap = await getDocs(
    collection(db, "users", uid, "dailyProfiles")
  );
  dailySnap.docs.forEach((d) => batch.delete(d.ref));

  // 3. Delete swipes by this user
  const swipesSnap = await getDocs(
    query(collection(db, "swipes"), where("swiperId", "==", uid))
  );
  swipesSnap.docs.forEach((d) => batch.delete(d.ref));

  // 4. Delete swipes targeting this user
  const swipedSnap = await getDocs(
    query(collection(db, "swipes"), where("swipedId", "==", uid))
  );
  swipedSnap.docs.forEach((d) => batch.delete(d.ref));

  // 5. Delete matches involving this user
  const matchesSnap = await getDocs(
    query(collection(db, "matches"), where("users", "array-contains", uid))
  );
  matchesSnap.docs.forEach((d) => batch.delete(d.ref));

  // 6. Delete dates involving this user
  const datesSnap = await getDocs(
    query(collection(db, "dates"), where("users", "array-contains", uid))
  );
  datesSnap.docs.forEach((d) => batch.delete(d.ref));

  // Commit Firestore deletions
  await batch.commit();

  // 7. Delete all photos from Storage
  try {
    const storageRef = ref(storage, `users/${uid}`);
    const fileList = await listAll(storageRef);
    await Promise.all(fileList.items.map((item) => deleteObject(item)));
  } catch {
    // Storage folder might not exist — that's fine
  }

  // 8. Delete Firebase Auth account
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === uid) {
    await deleteUser(currentUser);
  }
}
