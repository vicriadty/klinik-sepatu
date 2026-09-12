import { api } from "./api";

export interface ServiceOption {
  id: number;
  name: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  services_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  category_id: number;
  category: ServiceCategory;
  description: string | null;
  price: number;
  estimated_duration_days: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceListParams {
  search?: string;
  category_id?: number;
  active?: boolean;
}

export interface ServicePayload {
  name: string;
  category_id: number;
  description?: string | null;
  price: number;
  estimated_duration_days?: number | null;
  active?: boolean;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
}

export async function fetchServiceOptions(): Promise<ServiceOption[]> {
  const response = await api.get<{
    data: ServiceOption[];
  }>("/services", { params: { per_page: 100, active: 1 } });
  return response.data.data;
}

export async function fetchCategories(): Promise<ServiceCategory[]> {
  const response = await api.get<{ data: ServiceCategory[] }>(
    "/service-categories",
    { params: { per_page: 100 } }
  );
  return response.data.data;
}

export async function createCategory(
  payload: CategoryPayload
): Promise<ServiceCategory> {
  const response = await api.post<{ data: ServiceCategory }>(
    "/service-categories",
    payload
  );
  return response.data.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/service-categories/${id}`);
}

export async function fetchServices(
  params: ServiceListParams
): Promise<Service[]> {
  const response = await api.get<{ data: Service[] }>("/services", {
    params: { ...params, per_page: 100 },
  });
  return response.data.data;
}

export async function fetchService(id: string): Promise<Service> {
  const response = await api.get<{ data: Service }>(`/services/${id}`);
  return response.data.data;
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const response = await api.post<{ data: Service }>(`/services`, payload);
  return response.data.data;
}

export async function updateService(
  id: string,
  payload: Partial<ServicePayload>
): Promise<Service> {
  const response = await api.put<{ data: Service }>(
    `/services/${id}`,
    payload
  );
  return response.data.data;
}

export async function setServiceActive(
  id: number,
  active: boolean
): Promise<Service> {
  const response = await api.patch<{ data: Service }>(
    `/services/${id}/status`,
    { active }
  );
  return response.data.data;
}

export async function deleteService(id: number): Promise<void> {
  await api.delete(`/services/${id}`);
}
