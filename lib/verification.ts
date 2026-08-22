import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

export const VERIFICATION_POSES = {
  peace: {
    key: "peace" as const,
    emoji: "✌️",
    instruction: "Hold up two fingers next to your right ear",
  },
  thumbs_up: {
    key: "thumbs_up" as const,
    emoji: "👍",
    instruction: "Thumbs up next to your left cheek",
  },
  call_me: {
    key: "call_me" as const,
    emoji: "🤙",
    instruction: 'Make a "call me" gesture next to your chin',
  },
};

export type VerificationPoseKey = keyof typeof VERIFICATION_POSES;

/**
 * Pick a random pose so users can't share/cache selfies.
 * Re-roll happens each time the verification flow opens.
 */
export function pickRandomPose(): VerificationPoseKey {
  const keys = Object.keys(VERIFICATION_POSES) as VerificationPoseKey[];
  return keys[Math.floor(Math.random() * keys.length)];
}

const MAX_SELFIE_BYTES = 5 * 1024 * 1024; // 5 MB

export class VerificationError extends Error {
  constructor(public code: "too_large" | "wrong_type" | "upload_failed", msg: string) {
    super(msg);
    this.name = "VerificationError";
  }
}

/**
 * Submit a verification selfie.
 *
 * Flow:
 * 1. Upload selfie to /users/{uid}/verification/selfie-{timestamp}.jpg
 * 2. Update user doc with verificationStatus="pending" + pose + submittedAt
 *
 * Admin (Matthijs) reviews manually in Firebase Console and flips status
 * to "verified" or "rejected". Later: replace with Veriff/FaceTec API.
 */
export async function submitVerification(
  uid: string,
  file: File,
  pose: VerificationPoseKey
): Promise<void> {
  if (file.size > MAX_SELFIE_BYTES) {
    throw new VerificationError(
      "too_large",
      "That selfie is over 5MB — try again with a smaller photo."
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new VerificationError(
      "wrong_type",
      "Please upload an image (JPG or PNG)."
    );
  }

  const ts = Date.now();
  const path = `users/${uid}/verification/selfie-${ts}.jpg`;
  const r = ref(storage, path);

  try {
    await uploadBytes(r, file, { contentType: file.type });
    await getDownloadURL(r); // verify it landed
  } catch {
    throw new VerificationError(
      "upload_failed",
      "Couldn't upload your selfie. Check your connection and try again."
    );
  }

  await updateDoc(doc(db, "users", uid), {
    verificationStatus: "pending",
    verificationPose: pose,
    verificationSubmittedAt: serverTimestamp(),
  });
}
