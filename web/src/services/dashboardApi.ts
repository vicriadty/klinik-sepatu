import { api } from "./api";

export interface DashboardSummary {
  revenue_today?: number;
  orders_today: number;
  in_progress: number;
  ready_for_pickup: number;
  outstanding_payment: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrdersPoint {
  date: string;
  orders: number;
}

export interface TopService {
  service_id: number;
  service_name: string;
  orders_count: number;
  revenue: number;
}

export interface PaymentMethodStat {
  method: string;
  total: number;
  transactions: number;
}

export type ChartParams = Record<string, string | number>;

export async function fetchSummary(): Promise<DashboardSummary> {
  const response = await api.get<{ data: DashboardSummary }>(
    "/dashboard/summary"
  );
  return response.data.data;
}

export async function fetchRevenue(
  params: ChartParams
): Promise<RevenuePoint[]> {
  const response = await api.get<{ data: RevenuePoint[] }>(
    "/dashboard/revenue",
    { params }
  );
  return response.data.data;
}

export async function fetchOrders(params: ChartParams): Promise<OrdersPoint[]> {
  const response = await api.get<{ data: OrdersPoint[] }>("/dashboard/orders", {
    params,
  });
  return response.data.data;
}

export async function fetchTopServices(
  params: ChartParams
): Promise<TopService[]> {
  const response = await api.get<{ data: TopService[] }>(
    "/dashboard/top-services",
    { params }
  );
  return response.data.data;
}

export async function fetchPaymentMethods(
  params: ChartParams
): Promise<PaymentMethodStat[]> {
  const response = await api.get<{ data: PaymentMethodStat[] }>(
    "/dashboard/payment-methods",
    { params }
  );
  return response.data.data;
}
