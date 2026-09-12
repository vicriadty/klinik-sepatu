import { api } from "./api";

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
  const response = await api.post<{ data: LoginResponse }>("/auth/login", {
    username,
    password,
    device_name: "web",
  });
  return response.data.data;
}

export async function fetchMe(): Promise<ApiUser> {
  const response = await api.get<{ data: ApiUser }>("/auth/me");
  return response.data.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
