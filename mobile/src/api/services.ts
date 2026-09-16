import { apiFetch } from "./client";
import type { Paginated } from "./types";

export interface ApiService {
  id: number;
  name: string;
  category_id: number;
  category: { id: number; name: string } | null;
  description: string | null;
  price: number;
  estimated_duration_days: number | null;
  active: boolean;
}

export async function fetchServices(
  params: { active?: boolean; per_page?: number } = {}
): Promise<ApiService[]> {
  const query = new URLSearchParams();
  if (params.active !== undefined) {
    query.set("active", params.active ? "1" : "0");
  }
  query.set("per_page", String(params.per_page ?? 100));

  const response = await apiFetch<Paginated<ApiService>>(
    `/services?${query.toString()}`
  );
  return response.data;
}
