import type { OrderStatus, PaymentStatus } from "../../services/orderApi";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Diterima",
  ON_PROCESS: "Diproses",
  READY_FOR_PICKUP: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  RECEIVED:
    "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  ON_PROCESS:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  READY_FOR_PICKUP:
    "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-400",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Belum Bayar",
  PARTIAL: "Sebagian",
  PAID: "Lunas",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  PARTIAL:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  PAID: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
};

export const ALL_ORDER_STATUSES = Object.keys(
  ORDER_STATUS_LABELS
) as OrderStatus[];

export const ALL_PAYMENT_STATUSES = Object.keys(
  PAYMENT_STATUS_LABELS
) as PaymentStatus[];
