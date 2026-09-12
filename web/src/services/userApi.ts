import { api } from "./api";
import type { UserRole } from "./authApi";

export interface ApiUserSummary {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
}

export interface PaginatedUsers {
  data: ApiUserSummary[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email?: string | null;
  role: UserRole;
  password: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string | null;
  role?: UserRole;
  password?: string;
}

export async function fetchUsers(
  params: UserListParams
): Promise<PaginatedUsers> {
  const response = await api.get<PaginatedUsers>("/users", { params });
  return response.data;
}

export async function fetchUser(id: string): Promise<ApiUserSummary> {
  const response = await api.get<{ data: ApiUserSummary }>(`/users/${id}`);
  return response.data.data;
}

export async function createUser(
  payload: CreateUserPayload
): Promise<ApiUserSummary> {
  const response = await api.post<{ data: ApiUserSummary }>(`/users`, payload);
  return response.data.data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<ApiUserSummary> {
  const response = await api.put<{ data: ApiUserSummary }>(
    `/users/${id}`,
    payload
  );
  return response.data.data;
}

export async function setUserActive(
  id: number,
  is_active: boolean
): Promise<ApiUserSummary> {
  const response = await api.patch<{ data: ApiUserSummary }>(
    `/users/${id}/status`,
    { is_active }
  );
  return response.data.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
