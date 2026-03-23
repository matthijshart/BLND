import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadUserPhoto(
  uid: string,
  file: File,
  index: number
): Promise<string> {
  const storageRef = ref(storage, `users/${uid}/photos/${index}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteUserPhoto(
  uid: string,
  index: number
): Promise<void> {
  const storageRef = ref(storage, `users/${uid}/photos/${index}`);
  await deleteObject(storageRef);
}
