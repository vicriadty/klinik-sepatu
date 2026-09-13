import { create } from "zustand";
import { fetchMe, type ApiUser } from "../api/auth";
import { ApiError, setAuthToken } from "../api/client";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "./authStorage";

export type AuthStatus = "restoring" | "signedOut" | "signedIn";

interface AuthState {
  status: AuthStatus;
  user: ApiUser | null;
  signIn: (user: ApiUser, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "restoring",
  user: null,

  signIn: async (user, token) => {
    setAuthToken(token);
    await setStoredToken(token);
    set({ status: "signedIn", user });
  },

  signOut: async () => {
    setAuthToken(null);
    await clearStoredToken();
    set({ status: "signedOut", user: null });
  },

  restore: async () => {
    const token = await getStoredToken();
    if (!token) {
      set({ status: "signedOut", user: null });
      return;
    }

    setAuthToken(token);
    try {
      const user = await fetchMe();
      set({ status: "signedIn", user });
    } catch (error) {
      setAuthToken(null);
      if (error instanceof ApiError && error.status === 401) {
        await clearStoredToken();
      }
      set({ status: "signedOut", user: null });
    }
  },
}));
