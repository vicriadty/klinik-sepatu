import * as Crypto from "expo-crypto";
import { create } from "zustand";
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

export const useOrderWizardStore = create<OrderWizardState>((set, get) => ({
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

  /**
   * Satu key per percobaan order; retry memakai key yang sama sehingga
   * backend mengembalikan order yang sudah ada (ADR-0002).
   */
  ensureIdempotencyKey: () => {
    const existing = get().idempotencyKey;
    if (existing) {
      return existing;
    }
    const key = Crypto.randomUUID();
    set({ idempotencyKey: key });
    return key;
  },

  reset: () =>
    set({ customer: null, items: [], discountId: null, idempotencyKey: null }),
}));
