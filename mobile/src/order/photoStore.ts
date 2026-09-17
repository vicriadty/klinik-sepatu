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
  uri: string;
  type: PhotoType;
  status: UploadStatus;
  error: string | null;
}

interface PhotoState {
  drafts: Record<string, DraftPhoto[]>;
  queue: UploadEntry[];
  addDraft: (itemId: string, photo: Omit<DraftPhoto, "id">) => void;
  removeDraft: (itemId: string, photoId: string) => void;
  enqueueFromOrder: (
    items: { itemId: string; orderItemId: number }[]
  ) => void;
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
        const id = `photo-${nextPhotoNumber++}`;
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

      /**
       * Dipanggil setelah order dibuat: draft lokal dipindahkan ke antrean
       * upload yang terikat ke order item id dari server.
       */
      enqueueFromOrder: (items) => {
        const { drafts } = get();
        const queue: UploadEntry[] = [];

        items.forEach(({ itemId, orderItemId }) => {
          (drafts[itemId] ?? []).forEach((photo) => {
            queue.push({
              id: photo.id,
              orderItemId,
              uri: photo.uri,
              type: photo.type,
              status: "pending",
              error: null,
            });
          });
        });

        set({ drafts: {}, queue });
      },

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
