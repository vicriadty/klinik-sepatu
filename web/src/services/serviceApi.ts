import { api } from "./api";

export interface ServiceOption {
  id: number;
  name: string;
}

export async function fetchServiceOptions(): Promise<ServiceOption[]> {
  const response = await api.get<{
    data: ServiceOption[];
  }>("/services", { params: { per_page: 100, active: 1 } });
  return response.data.data;
}
