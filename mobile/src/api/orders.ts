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

export interface ApiOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: ApiCustomer;
  items?: ApiOrderItem[];
  status: string;
  payment_status: string;
  subtotal: number;
  discount_id: number | null;
  discount_value: number;
  grand_total: number;
  paid_total: number;
  remaining_balance: number;
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
