import { setUnauthorizedHandler } from "../api/client";
import { useAuthStore } from "./useAuthStore";

let bootstrapped = false;

/**
 * Dipanggil sekali saat app start: pasang handler 401 (sesi mati → logout)
 * lalu pulihkan sesi dari SecureStore.
 */
export function bootstrapSession(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  setUnauthorizedHandler(() => {
    void useAuthStore.getState().signOut();
  });
  void useAuthStore.getState().restore();
}
