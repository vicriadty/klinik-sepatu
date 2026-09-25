import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PhotoType } from "../api/photos";

export type PhotoAngle = "front" | "back" | "left" | "right" | "top" | "damage";

/**
 * Camera angles are wizard guidance for photo completeness only — the API
 * stores just the photo `type` (ADR-0007). "Kerusakan" maps to DAMAGE.
 */
export const PHOTO_ANGLES: { value: PhotoAngle; label: string }[] = [
  { value: "front", label: "Depan" },
  { value: "back", label: "Belakang" },
  { value: "left", label: "Kiri" },
  { value: "right", label: "Kanan" },
  { value: "top", label: "Atas" },
  { value: "damage", label: "Kerusakan" },
];

export function angleLabel(angle: PhotoAngle): string {
  return PHOTO_ANGLES.find((entry) => entry.value === angle)?.label ?? angle;
}

export function typeForAngle(angle: PhotoAngle): PhotoType {
  return angle === "damage" ? "DAMAGE" : "BEFORE";
}

export interface DraftPhoto {
  id: string;
  uri: string;
  angle: PhotoAngle;
  type: PhotoType;
  fileName?: string | null;
  mimeType?: string | null;
}

export type UploadStatus = "pending" | "uploading" | "uploaded" | "failed";

export const UPLOAD_STATUS_LABELS: Record<UploadStatus, string> = {
  pending: "Menunggu",
  uploading: "Mengunggah…",
  uploaded: "Terunggah",
  failed: "Gagal",
};

export interface UploadEntry {
  id: string;
  orderItemId: number;
  orderId?: number;
  uri: string;
  type: PhotoType;
  fileName?: string | null;
  mimeType?: string | null;
  status: UploadStatus;
  error: string | null;
}

interface PhotoState {
  drafts: Record<string, DraftPhoto[]>;
  queue: UploadEntry[];
  addDraft: (itemId: string, photo: Omit<DraftPhoto, "id">) => void;
  removeDraft: (itemId: string, photoId: string) => void;
  removeDraftsForItem: (itemId: string) => void;
  enqueueFromOrder: (
    items: { itemId: string; orderItemId: number }[],
    orderId?: number
  ) => void;
  clearDrafts: () => void;
  setStatus: (id: string, status: UploadStatus, error?: string | null) => void;
  clear: () => void;
}

let nextPhotoNumber = 1;

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set, get) => ({
      drafts: {},
      queue: [],

      addDraft: (itemId, photo) => {
        const state = get();
        const usedIds = new Set([
          ...Object.values(state.drafts)
            .flat()
            .map((entry) => entry.id),
          ...state.queue.map((entry) => entry.id),
        ]);
        let id = `photo-${nextPhotoNumber}`;
        while (usedIds.has(id)) {
          nextPhotoNumber += 1;
          id = `photo-${nextPhotoNumber}`;
        }
        nextPhotoNumber += 1;
        set((state) => ({
          drafts: {
            ...state.drafts,
            [itemId]: [...(state.drafts[itemId] ?? []), { id, ...photo }],
          },
        }));
      },

      removeDraft: (itemId, photoId) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [itemId]: (state.drafts[itemId] ?? []).filter(
              (photo) => photo.id !== photoId
            ),
          },
        })),

      removeDraftsForItem: (itemId) =>
        set((state) => {
          const drafts = { ...state.drafts };
          delete drafts[itemId];
          return { drafts };
        }),

      /**
       * Dipanggil setelah order dibuat: draft lokal dipindahkan ke antrean
       * upload yang terikat ke order item id dari server.
       */
      enqueueFromOrder: (items, orderId) =>
        set((state) => {
          const itemIds = new Set(items.map(({ itemId }) => itemId));
          const queue: UploadEntry[] = [];

          items.forEach(({ itemId, orderItemId }) => {
            (state.drafts[itemId] ?? []).forEach((photo) => {
              queue.push({
                id: photo.id,
                orderItemId,
                ...(orderId !== undefined ? { orderId } : {}),
                uri: photo.uri,
                type: photo.type,
                ...(photo.fileName !== undefined
                  ? { fileName: photo.fileName }
                  : {}),
                ...(photo.mimeType !== undefined
                  ? { mimeType: photo.mimeType }
                  : {}),
                status: "pending",
                error: null,
              });
            });
          });

          return {
            drafts: Object.fromEntries(
              Object.entries(state.drafts).filter(
                ([itemId]) => !itemIds.has(itemId)
              )
            ),
            queue: [
              ...state.queue.filter(
                (entry) => !queue.some((next) => next.id === entry.id)
              ),
              ...queue,
            ],
          };
        }),

      clearDrafts: () => set({ drafts: {} }),

      setStatus: (id, status, error = null) =>
        set((state) => ({
          queue: state.queue.map((entry) =>
            entry.id === id ? { ...entry, status, error } : entry
          ),
        })),

      clear: () => set({ drafts: {}, queue: [] }),
    }),
    {
      name: "ks-photo-queue",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        drafts: state.drafts,
        queue: state.queue.filter((entry) => entry.status !== "uploaded"),
      }),
    }
  )
);
