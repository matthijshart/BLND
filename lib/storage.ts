import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

// Max file size: 5MB before compression (compressed output is ~200KB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export class PhotoUploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_type"
      | "too_large"
      | "network"
      | "compression_failed"
      | "upload_failed"
      | "permission_denied"
      | "unknown"
  ) {
    super(message);
    this.name = "PhotoUploadError";
  }
}

/**
 * Validate a file before attempting to upload it.
 * Throws a PhotoUploadError with a user-friendly message on failure.
 */
export function validatePhotoFile(file: File): void {
  if (!file.type || !file.type.startsWith("image/")) {
    throw new PhotoUploadError(
      "That doesn't look like an image. Try a JPEG, PNG, or HEIC.",
      "invalid_type"
    );
  }

  // Some iOS images come through as "image/heic" — allow anything starting with image/
  if (!ACCEPTED_TYPES.some((t) => file.type === t) && !file.type.startsWith("image/")) {
    throw new PhotoUploadError(
      "That image format isn't supported. Try a JPEG or PNG.",
      "invalid_type"
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new PhotoUploadError(
      `That photo is ${mb}MB — too big. Try one under 5MB.`,
      "too_large"
    );
  }
}

/**
 * Compress an image file before uploading.
 * Resizes to max 1200px and converts to JPEG at 80% quality.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new PhotoUploadError("Not an image", "invalid_type"));
    }

    const objectUrl = URL.createObjectURL(file);
    const img = document.createElement("img");

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1200;

        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height / width) * MAX_SIZE;
            width = MAX_SIZE;
          } else {
            width = (width / height) * MAX_SIZE;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new PhotoUploadError("Canvas not supported", "compression_failed"));
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new PhotoUploadError("Couldn't process that photo. Try another one.", "compression_failed"));
          },
          "image/jpeg",
          0.8
        );
      } catch {
        reject(new PhotoUploadError("Couldn't process that photo. Try another one.", "compression_failed"));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new PhotoUploadError("Couldn't read that photo. Try another one.", "compression_failed"));
    };

    img.src = objectUrl;
  });
}

/**
 * Upload a photo to Firebase Storage with retry on network errors.
 * Throws PhotoUploadError on failure.
 */
/** Collision-proof object name for a photo upload. */
function photoFileName(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function uploadUserPhoto(
  uid: string,
  file: File,
  index: number,
  options?: { onProgress?: (stage: "validating" | "compressing" | "uploading") => void }
): Promise<string> {
  options?.onProgress?.("validating");
  validatePhotoFile(file);

  // The display index must NOT be the filename. The photos array is
  // reorderable and filter()s on delete, so index N stops pointing at
  // photos/N.jpg the moment anyone reorders or removes one — after which
  // deleting a photo destroys a different one and an upload silently
  // overwrites a live file. Every upload gets its own name instead.
  const storageRef = ref(storage, `users/${uid}/photos/${photoFileName()}.jpg`);

  // Try to compress; fall back to original if compression fails
  let payload: Blob | File = file;
  let contentType = file.type || "image/jpeg";

  options?.onProgress?.("compressing");
  try {
    payload = await compressImage(file);
    contentType = "image/jpeg";
  } catch {
    // Compression failed — upload original (may be HEIC from iOS)
    payload = file;
    contentType = file.type || "image/jpeg";
  }

  // Retry upload up to 3 times on network errors (exponential backoff)
  options?.onProgress?.("uploading");
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await uploadBytes(storageRef, payload, { contentType });
      return await getDownloadURL(storageRef);
    } catch (err: unknown) {
      lastError = err;
      const code = (err as { code?: string })?.code;
      // Don't retry permission errors — the user needs to re-auth
      if (code === "storage/unauthorized") {
        throw new PhotoUploadError(
          "Couldn't upload — please sign out and back in.",
          "permission_denied"
        );
      }
      // Retry on network/unknown errors
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  // All retries failed
  const code = (lastError as { code?: string })?.code;
  if (code === "storage/retry-limit-exceeded" || code?.includes("network")) {
    throw new PhotoUploadError(
      "Upload failed — check your connection and try again.",
      "network"
    );
  }
  throw new PhotoUploadError(
    "Upload failed. Try again in a moment.",
    "upload_failed"
  );
}

export async function deleteUserPhoto(downloadUrl: string): Promise<void> {
  // Delete the exact object the URL points at. Deriving the path from a
  // display index instead is what let a reorder send this at the wrong file.
  if (!downloadUrl || !downloadUrl.includes("firebasestorage")) {
    // Seed/stock photos and anything not in our bucket: nothing to remove.
    return;
  }
  try {
    await deleteObject(ref(storage, downloadUrl));
  } catch {
    // Already gone, or never ours — either way there is nothing to clean up.
  }
}
