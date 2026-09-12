import { useQuery } from "@tanstack/react-query";
import {
  fetchOrders,
  fetchPaymentMethods,
  fetchRevenue,
  fetchSummary,
  fetchTopServices,
  type ChartParams,
} from "../../services/dashboardApi";
import { isPeriodReady, toQueryParams, type PeriodFilter } from "./period";

export function useSummary() {
  return useQuery({ queryKey: ["dashboard", "summary"], queryFn: fetchSummary });
}

export function useRevenue(filter: PeriodFilter) {
  const params: ChartParams = toQueryParams(filter);
  return useQuery({
    queryKey: ["dashboard", "revenue", params],
    queryFn: () => fetchRevenue(params),
    enabled: isPeriodReady(filter),
  });
}

export function useOrders(filter: PeriodFilter) {
  const params: ChartParams = toQueryParams(filter);
  return useQuery({
    queryKey: ["dashboard", "orders", params],
    queryFn: () => fetchOrders(params),
    enabled: isPeriodReady(filter),
  });
}

export function useTopServices(filter: PeriodFilter) {
  const params: ChartParams = toQueryParams(filter);
  return useQuery({
    queryKey: ["dashboard", "top-services", params],
    queryFn: () => fetchTopServices(params),
    enabled: isPeriodReady(filter),
  });
}

export function usePaymentMethods(filter: PeriodFilter) {
  const params: ChartParams = toQueryParams(filter);
  return useQuery({
    queryKey: ["dashboard", "payment-methods", params],
    queryFn: () => fetchPaymentMethods(params),
    enabled: isPeriodReady(filter),
  });
}
