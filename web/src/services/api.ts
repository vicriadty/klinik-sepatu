import axios, { AxiosError } from "axios";
import { clearToken, getToken } from "../features/auth/authStorage";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let redirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Any 401 outside the login page means the session died: wipe it and
    // force a clean reload to /login (avoids stale query caches).
    if (
      error.response?.status === 401 &&
      !redirecting &&
      window.location.pathname !== "/login"
    ) {
      redirecting = true;
      clearToken();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export type ApiFieldErrors = Record<string, string[]>;

export interface ApiError {
  status?: number;
  message: string;
  fields: ApiFieldErrors;
}

export function toApiError(error: unknown, fallback: string): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { message?: string; errors?: ApiFieldErrors }
      | undefined;
    return {
      status,
      message: data?.message ?? fallback,
      fields: data?.errors ?? {},
    };
  }
  return { message: fallback, fields: {} };
}
