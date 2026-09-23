import { uploadItemPhoto } from "../api/photos";
import { apiErrorMessage } from "../utils/errors";
import { deletePhotoFile } from "./photoFiles";
import { usePhotoStore } from "./photoStore";

let uploading = false;

/**
 * Uploads queued photos (pending + failed), optionally scoped to specific
 * order items. Successful uploads delete the local copy (prd-mobile §23).
 * A single failure never blocks the rest.
 */
export async function uploadQueuedPhotos(
  options: { onlyItemIds?: number[]; onlyOrderId?: number } = {}
): Promise<void> {
  if (uploading) {
    return;
  }
  uploading = true;

  try {
    const store = usePhotoStore.getState();
    const pending = store.queue.filter(
      (entry) =>
        (entry.status === "pending" || entry.status === "failed") &&
        (options.onlyItemIds === undefined ||
          options.onlyItemIds.includes(entry.orderItemId)) &&
        (options.onlyOrderId === undefined ||
          entry.orderId === options.onlyOrderId ||
          entry.orderId === undefined)
    );

    for (const entry of pending) {
      store.setStatus(entry.id, "uploading");
      try {
        const input = {
          uri: entry.uri,
          type: entry.type,
          ...(entry.fileName !== undefined
            ? { fileName: entry.fileName }
            : {}),
          ...(entry.mimeType !== undefined
            ? { mimeType: entry.mimeType }
            : {}),
        };
        await uploadItemPhoto(entry.orderItemId, input);
        store.setStatus(entry.id, "uploaded");
        deletePhotoFile(entry.uri);
      } catch (error) {
        store.setStatus(
          entry.id,
          "failed",
          apiErrorMessage(error, "Gagal mengunggah foto.")
        );
      }
    }
  } finally {
    uploading = false;
  }
}
