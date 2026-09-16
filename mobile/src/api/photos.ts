import { apiFetch } from "./client";

export type PhotoType = "BEFORE" | "AFTER" | "DAMAGE" | "QC";

export interface ApiPhoto {
  id: number;
  order_item_id: number;
  type: PhotoType;
  url: string;
  thumbnail_url: string | null;
  mime: string | null;
  size: number | null;
  created_at: string | null;
}

export interface UploadPhotoInput {
  uri: string;
  type: PhotoType;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function fetchItemPhotos(itemId: number): Promise<ApiPhoto[]> {
  const response = await apiFetch<{ data: ApiPhoto[] }>(
    `/order-items/${itemId}/photos`
  );
  return response.data;
}

/**
 * Multipart upload. The backend accepts jpeg/png/webp up to 5 MB and only
 * stores the `type` (BEFORE/AFTER/DAMAGE/QC) — camera angles stay UI-only
 * guidance (ADR-0007).
 */
export async function uploadItemPhoto(
  itemId: number,
  input: UploadPhotoInput
): Promise<ApiPhoto> {
  const formData = new FormData();
  formData.append("type", input.type);
  formData.append("photo", {
    uri: input.uri,
    name: input.fileName ?? `photo-${Date.now()}.jpg`,
    type: input.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  const response = await apiFetch<{ data: ApiPhoto }>(
    `/order-items/${itemId}/photos`,
    { method: "POST", formData }
  );
  return response.data;
}

export async function deleteItemPhoto(photoId: number): Promise<void> {
  await apiFetch<void>(`/order-item-photos/${photoId}`, { method: "DELETE" });
}
