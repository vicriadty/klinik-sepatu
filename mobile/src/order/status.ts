import type { OrderStatus, PaymentStatus } from "../api/orders";
import type { PillTone } from "../components/StatusPill";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Diterima",
  ON_PROCESS: "Diproses",
  READY_FOR_PICKUP: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, PillTone> = {
  RECEIVED: "info",
  ON_PROCESS: "warning",
  READY_FOR_PICKUP: "info",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, PillTone> = {
  UNPAID: "danger",
  PARTIAL: "warning",
  PAID: "success",
};

export const ORDER_STATUSES: OrderStatus[] = [
  "RECEIVED",
  "ON_PROCESS",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
];

/**
 * Mirrors Order::TRANSITIONS (backend contract, ADR-0001). The backend stays
 * the authority: this only drives which actions are offered.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: ["ON_PROCESS", "CANCELLED"],
  ON_PROCESS: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const ACTION_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Diterima",
  ON_PROCESS: "Mulai Proses",
  READY_FOR_PICKUP: "Siap Diambil",
  COMPLETED: "Selesaikan",
  CANCELLED: "Batalkan",
};

export interface OrderTransitionView {
  status: OrderStatus;
  label: string;
}

export interface TransitionableOrder {
  status: OrderStatus;
  payment_status: PaymentStatus;
  paid_total: number;
}

/**
 * Only transitions the backend will accept (guards included): COMPLETED
 * requires PAID, CANCELLED requires no recorded payments (refund first).
 */
export function legalTransitions(
  order: TransitionableOrder
): OrderTransitionView[] {
  return ORDER_STATUS_TRANSITIONS[order.status]
    .filter((status) => {
      if (status === "COMPLETED") {
        return order.payment_status === "PAID";
      }
      if (status === "CANCELLED") {
        return order.paid_total === 0;
      }
      return true;
    })
    .map((status) => ({ status, label: ACTION_LABELS[status] }));
}

export function blockedTransitionHint(
  order: TransitionableOrder
): string | null {
  if (order.status === "READY_FOR_PICKUP" && order.payment_status !== "PAID") {
    return "Pelunasan diperlukan sebelum order bisa diselesaikan.";
  }

  if (
    (order.status === "RECEIVED" || order.status === "ON_PROCESS") &&
    order.paid_total > 0
  ) {
    return "Refund diperlukan sebelum order berbayar bisa dibatalkan.";
  }

  return null;
}
