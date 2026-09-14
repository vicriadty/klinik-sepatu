import { ApiError } from "../api/client";

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return "Periksa kembali data yang diisi.";
    }
    if (error.status !== undefined && error.status >= 500) {
      return "Terjadi kesalahan pada server. Coba lagi.";
    }
    return error.message;
  }
  return fallback;
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Username atau password salah.";
    }
    if (error.status === 403) {
      return "Akun dinonaktifkan. Hubungi Owner atau Admin.";
    }
    return apiErrorMessage(error, "Terjadi kesalahan. Coba lagi.");
  }
  return "Terjadi kesalahan. Coba lagi.";
}
