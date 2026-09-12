import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import { clearToken } from "./authStorage";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  if (token === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Memuat sesi…
      </div>
    );
  }

  if (user === null) {
    // Token exists but yields no user: stale session, drop it.
    clearToken();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
