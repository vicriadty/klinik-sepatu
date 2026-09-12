import { api } from "./api";

export type OrderStatus =
  | "RECEIVED"
  | "ON_PROCESS"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export interface OrderCustomer {
  id: number;
  name: string;
  phone: string;
}

export interface OrderItemService {
  service_id: number;
  service_name: string;
  unit_price: number;
}

export interface OrderPhoto {
  id: number;
  type: string;
  url: string;
  thumbnail_url: string | null;
}

export interface OrderItem {
  id: number;
  brand: string;
  model: string | null;
  color: string | null;
  shoe_type: string;
  customer_note: string | null;
  internal_note: string | null;
  services: OrderItemService[];
  item_subtotal: number;
  photos: OrderPhoto[];
}

export interface OrderPayment {
  id: number;
  type: string;
  method: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface OrderStatusHistory {
  from_status: string | null;
  to_status: string;
  actor_user_id: number | null;
  note: string | null;
  created_at: string;
}

export interface OrderDetail {
  id: number;
  order_number: string;
  customer: OrderCustomer;
  items: OrderItem[];
  items_count: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  discount_id: number | null;
  discount_value: number;
  grand_total: number;
  paid_total: number;
  remaining_balance: number;
  notes: string | null;
  payments: OrderPayment[];
  status_histories: OrderStatusHistory[];
  created_at: string;
}

export interface OrderListItem {
  id: number;
  order_number: string;
  customer: OrderCustomer;
  items_count: number;
  grand_total: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  created_at: string;
}

export interface OrderListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  service_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}

export async function fetchOrders(
  params: OrderListParams
): Promise<Paginated<OrderListItem>> {
  const response = await api.get<Paginated<OrderListItem>>("/orders", {
    params,
  });
  return response.data;
}

export async function fetchOrder(id: string): Promise<OrderDetail> {
  const response = await api.get<{ data: OrderDetail }>(`/orders/${id}`);
  return response.data.data;
}

export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string
): Promise<OrderDetail> {
  const response = await api.post<{ data: OrderDetail }>(
    `/orders/${id}/status`,
    { status, note }
  );
  return response.data.data;
}

export async function cancelOrder(
  id: string,
  reason?: string
): Promise<OrderDetail> {
  const response = await api.post<{ data: OrderDetail }>(
    `/orders/${id}/cancel`,
    { reason }
  );
  return response.data.data;
}
