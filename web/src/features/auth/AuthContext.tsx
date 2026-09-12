import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  type ApiUser,
} from "../../services/authApi";
import { clearToken, getToken, setToken } from "./authStorage";

export interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: token !== null,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const login = useCallback(
    async (username: string, password: string): Promise<void> => {
      const { user, token: newToken } = await loginRequest(username, password);
      setToken(newToken);
      setTokenState(newToken);
      queryClient.setQueryData(["me"], user);
    },
    [queryClient]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } catch {
      // Best effort: a dead session still logs out locally.
    }
    clearToken();
    setTokenState(null);
    queryClient.removeQueries({ queryKey: ["me"] });
  }, [queryClient]);

  const user = meQuery.data ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading: token !== null && meQuery.isLoading,
        isAuthenticated: token !== null && user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
