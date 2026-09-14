import { apiFetch } from "./client";

export interface DashboardSummary {
  revenue_today?: number;
  orders_today: number;
  in_progress: number;
  ready_for_pickup: number;
  outstanding_payment: number;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiFetch<{ data: DashboardSummary }>(
    "/dashboard/summary"
  );
  return response.data;
}
