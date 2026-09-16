import { apiFetch } from "./client";
import type { Paginated } from "./types";

export type DiscountType = "PERCENT" | "FIXED";

export interface ApiDiscount {
  id: number;
  name: string;
  type: DiscountType;
  value: number;
  active: boolean;
  min_order_subtotal: number | null;
}

export async function fetchDiscounts(
  params: { active?: boolean; per_page?: number } = {}
): Promise<ApiDiscount[]> {
  const query = new URLSearchParams();
  if (params.active !== undefined) {
    query.set("active", params.active ? "1" : "0");
  }
  query.set("per_page", String(params.per_page ?? 100));

  const response = await apiFetch<Paginated<ApiDiscount>>(
    `/discounts?${query.toString()}`
  );
  return response.data;
}
