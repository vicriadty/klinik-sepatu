import type { OrderListParams } from "../../services/orderApi";

export interface OrderFilters {
  page: number;
  search: string;
  status: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: OrderFilters = {
  page: 1,
  search: "",
  status: "",
  paymentStatus: "",
  dateFrom: "",
  dateTo: "",
};

export function parseFilters(params: URLSearchParams): OrderFilters {
  return {
    page: Math.max(1, Number(params.get("page")) || 1),
    search: params.get("search") ?? "",
    status: params.get("status") ?? "",
    paymentStatus: params.get("payment_status") ?? "",
    dateFrom: params.get("date_from") ?? "",
    dateTo: params.get("date_to") ?? "",
  };
}

export function serializeFilters(filters: OrderFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  if (filters.search !== "") params.set("search", filters.search);
  if (filters.status !== "") params.set("status", filters.status);
  if (filters.paymentStatus !== "")
    params.set("payment_status", filters.paymentStatus);
  if (filters.dateFrom !== "") params.set("date_from", filters.dateFrom);
  if (filters.dateTo !== "") params.set("date_to", filters.dateTo);
  return params;
}

export function toListParams(filters: OrderFilters): OrderListParams {
  return {
    page: filters.page,
    per_page: 15,
    ...(filters.search !== "" ? { search: filters.search } : {}),
    ...(filters.status !== "" ? { status: filters.status } : {}),
    ...(filters.paymentStatus !== ""
      ? { payment_status: filters.paymentStatus }
      : {}),
    ...(filters.dateFrom !== "" ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo !== "" ? { date_to: filters.dateTo } : {}),
  };
}
