import { apiFetch } from "./client";
import type { ApiCustomer } from "./customers";

export interface CreateOrderItemPayload {
  brand: string;
  model?: string;
  color?: string;
  shoe_type: string;
  customer_note?: string;
  services: number[];
}

export interface CreateOrderPayload {
  customer_id: number;
  discount_id?: number;
  notes?: string;
  items: CreateOrderItemPayload[];
}

export interface ApiOrderService {
  service_id: number;
  service_name: string;
  unit_price: number;
}

export interface ApiOrderItem {
  id: number;
  brand: string;
  model: string | null;
  color: string | null;
  shoe_type: string;
  customer_note: string | null;
  services?: ApiOrderService[];
  item_subtotal?: number;
}

export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER";

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "QRIS", "TRANSFER"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer",
};

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Belum dibayar",
  PARTIAL: "Dibayar sebagian",
  PAID: "Lunas",
};

export interface ApiPayment {
  id: number;
  order_id: number;
  type: "payment" | "refund";
  method: PaymentMethod;
  amount: number;
  note: string | null;
  receiver: { id: number; name: string; username: string } | null;
  created_at: string | null;
}

export interface RecordPaymentPayload {
  method: PaymentMethod;
  amount: number;
  note?: string;
}

export interface ApiOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: ApiCustomer;
  items?: ApiOrderItem[];
  status: string;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_id: number | null;
  discount_value: number;
  grand_total: number;
  paid_total: number;
  remaining_balance: number;
  payments?: ApiPayment[];
  created_at: string | null;
}

/**
 * Order-first creation (ADR-0002). The `Idempotency-Key` header maps to the
 * backend `client_request_id`; a replay returns the existing order (200)
 * instead of creating a duplicate.
 */
export async function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string
): Promise<ApiOrder> {
  const response = await apiFetch<{ data: ApiOrder }>("/orders", {
    method: "POST",
    body: payload,
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function fetchOrder(orderId: number): Promise<ApiOrder> {
  const response = await apiFetch<{ data: ApiOrder }>(`/orders/${orderId}`);
  return response.data;
}

/**
 * Records a payment (server recomputes paid_total and payment_status).
 * Retrying with the same idempotency key returns the existing payment (200).
 */
export async function recordPayment(
  orderId: number,
  payload: RecordPaymentPayload,
  idempotencyKey: string
): Promise<ApiPayment> {
  const response = await apiFetch<{ data: ApiPayment }>(
    `/orders/${orderId}/payments`,
    {
      method: "POST",
      body: payload,
      headers: { "Idempotency-Key": idempotencyKey },
    }
  );
  return response.data;
}
