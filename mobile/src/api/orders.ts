import { apiFetch } from "./client";
import type { ApiCustomer } from "./customers";
import type { ApiPhoto } from "./photos";
import type { Paginated } from "./types";

export type OrderStatus =
  | "RECEIVED"
  | "ON_PROCESS"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

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
  photos?: ApiPhoto[];
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
  type?: "payment" | "refund";
}

export interface ApiOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: ApiCustomer;
  items?: ApiOrderItem[];
  items_count?: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_id: number | null;
  discount_value: number;
  grand_total: number;
  paid_total: number;
  remaining_balance: number;
  payments?: ApiPayment[];
  status_histories?: {
    from_status: OrderStatus | null;
    to_status: OrderStatus;
    actor_user_id: number | null;
    note: string | null;
    created_at: string | null;
  }[];
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

export interface OrderListParams {
  search?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  page?: number;
  per_page?: number;
}

export async function fetchOrders(
  params: OrderListParams = {}
): Promise<Paginated<ApiOrder>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.payment_status) {
    query.set("payment_status", params.payment_status);
  }
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));

  const qs = query.toString();

  return apiFetch<Paginated<ApiOrder>>(`/orders${qs ? `?${qs}` : ""}`);
}

export async function transitionOrder(
  orderId: number,
  status: OrderStatus,
  note?: string
): Promise<ApiOrder> {
  const response = await apiFetch<{ data: ApiOrder }>(
    `/orders/${orderId}/status`,
    {
      method: "POST",
      body: { status, ...(note ? { note } : {}) },
    }
  );
  return response.data;
}

export async function cancelOrder(
  orderId: number,
  reason?: string
): Promise<ApiOrder> {
  const response = await apiFetch<{ data: ApiOrder }>(
    `/orders/${orderId}/cancel`,
    {
      method: "POST",
      body: { ...(reason ? { reason } : {}) },
    }
  );
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
