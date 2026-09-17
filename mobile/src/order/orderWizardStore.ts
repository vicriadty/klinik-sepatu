import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ApiCustomer } from "../api/customers";

export interface WizardItemInput {
  brand: string;
  model: string;
  color: string;
  shoeType: string;
  customerNote: string;
}

export interface WizardItem extends WizardItemInput {
  id: string;
  serviceIds: number[];
}

interface OrderWizardState {
  customer: ApiCustomer | null;
  items: WizardItem[];
  discountId: number | null;
  idempotencyKey: string | null;
  setCustomer: (customer: ApiCustomer | null) => void;
  addItem: (input: WizardItemInput) => string;
  updateItem: (id: string, input: WizardItemInput) => void;
  removeItem: (id: string) => void;
  setItemServices: (id: string, serviceIds: number[]) => void;
  setDiscountId: (discountId: number | null) => void;
  ensureIdempotencyKey: () => string;
  reset: () => void;
}

let nextItemNumber = 1;

/**
 * Persisted as the local order draft (prd-mobile §22): the wizard survives
 * app restarts, and the idempotency key survives a crash mid-submit so a
 * retry cannot create a duplicate order (ADR-0002).
 */
export const useOrderWizardStore = create<OrderWizardState>()(
  persist(
    (set, get) => ({
      customer: null,
      items: [],
      discountId: null,
      idempotencyKey: null,

      setCustomer: (customer) => set({ customer }),

      addItem: (input) => {
        const id = `item-${nextItemNumber++}`;
        set((state) => ({
          items: [...state.items, { id, ...input, serviceIds: [] }],
        }));
        return id;
      },

      updateItem: (id, input) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...input } : item
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      setItemServices: (id, serviceIds) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, serviceIds } : item
          ),
        })),

      setDiscountId: (discountId) => set({ discountId }),

      ensureIdempotencyKey: () => {
        const existing = get().idempotencyKey;
        if (existing) {
          return existing;
        }
        const generated = Crypto.randomUUID();
        set({ idempotencyKey: generated });
        return generated;
      },

      reset: () =>
        set({
          customer: null,
          items: [],
          discountId: null,
          idempotencyKey: null,
        }),
    }),
    {
      name: "ks-order-draft",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        customer: state.customer,
        items: state.items,
        discountId: state.discountId,
        idempotencyKey: state.idempotencyKey,
      }),
    }
  )
);
