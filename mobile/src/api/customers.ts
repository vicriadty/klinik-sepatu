import { apiFetch } from "./client";
import type { Paginated } from "./types";

export interface ApiCustomer {
  id: number;
  name: string;
  phone: string;
  phone_display: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  wa_opt_out: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CustomerSearchParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export async function searchCustomers(
  params: CustomerSearchParams = {}
): Promise<Paginated<ApiCustomer>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));

  const qs = query.toString();

  return apiFetch<Paginated<ApiCustomer>>(`/customers${qs ? `?${qs}` : ""}`);
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
}

export async function createCustomer(
  payload: CreateCustomerPayload
): Promise<ApiCustomer> {
  const response = await apiFetch<{ data: ApiCustomer }>("/customers", {
    method: "POST",
    body: payload,
  });
  return response.data;
}

/**
 * 409 responses carry the existing customer in `data.customer`
 * (see CustomerController::duplicateResponse).
 */
export function duplicateCustomerFrom(error: unknown): ApiCustomer | null {
  const payload = (error as { payload?: unknown } | null)?.payload;
  const customer = (payload as { data?: { customer?: ApiCustomer } } | null)
    ?.data?.customer;
  return customer ?? null;
}
