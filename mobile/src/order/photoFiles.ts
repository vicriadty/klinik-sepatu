import { Directory, File, Paths } from "expo-file-system";

const PHOTOS_DIR_NAME = "order-photos";

function photosDirectory(): Directory {
  return new Directory(Paths.document, PHOTOS_DIR_NAME);
}

/**
 * Copies a picked photo into the app's document directory so the draft and
 * upload queue survive restarts (the picker cache can be cleared by the OS).
 * Falls back to the original uri when the copy fails.
 */
export async function persistPhotoFile(uri: string): Promise<string> {
  try {
    const directory = photosDirectory();
    if (!directory.exists) {
      directory.create({ intermediates: true, idempotent: true });
    }

    const target = new File(
      directory,
      `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    );
    await new File(uri).copy(target);

    return target.uri;
  } catch {
    return uri;
  }
}

/**
 * Cleanup policy (prd-mobile §23): only files copied into the app's photo
 * directory are removed; picker/library uris are left untouched.
 */
export function deletePhotoFile(uri: string): void {
  try {
    if (!uri.includes(`/${PHOTOS_DIR_NAME}/`)) {
      return;
    }

    new File(uri).delete();
  } catch {
    // File already gone or not deletable — nothing to clean up.
  }
}

export function deletePhotoFiles(uris: string[]): void {
  uris.forEach((uri) => deletePhotoFile(uri));
}
