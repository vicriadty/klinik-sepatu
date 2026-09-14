import { apiFetch } from "./client";

export type UserRole = "owner" | "admin" | "cashier";

export interface ApiUser {
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

export interface LoginResponse {
  user: ApiUser;
  token: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  cashier: "Kasir",
};

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await apiFetch<{ data: LoginResponse }>("/auth/login", {
    method: "POST",
    body: { username, password, device_name: "mobile" },
    skipUnauthorizedHandler: true,
  });
  return response.data;
}

export async function fetchMe(): Promise<ApiUser> {
  const response = await apiFetch<{ data: ApiUser }>("/auth/me");
  return response.data;
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}
