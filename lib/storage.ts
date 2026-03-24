import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Compress an image file before uploading.
 * Resizes to max 1200px and converts to JPEG at 80% quality.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Skip compression for non-image files
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Not an image"));
    }

    const img = document.createElement("img");
    img.onload = () => {
      URL.revokeObjectURL(img.src);
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
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Compression failed"));
          },
          "image/jpeg",
          0.8
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    // Don't set crossOrigin for local blob URLs
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadUserPhoto(
  uid: string,
  file: File,
  index: number
): Promise<string> {
  const storageRef = ref(storage, `users/${uid}/photos/${index}.jpg`);

  try {
    const compressed = await compressImage(file);
    await uploadBytes(storageRef, compressed, {
      contentType: "image/jpeg",
    });
  } catch {
    // Fallback: upload original file without compression
    await uploadBytes(storageRef, file, {
      contentType: file.type || "image/jpeg",
    });
  }

  return getDownloadURL(storageRef);
}

export async function deleteUserPhoto(
  uid: string,
  index: number
): Promise<void> {
  const storageRef = ref(storage, `users/${uid}/photos/${index}.jpg`);
  try {
    await deleteObject(storageRef);
  } catch {
    // Ignore if file doesn't exist
  }
}
