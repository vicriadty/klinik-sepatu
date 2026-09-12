import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthContext, type AuthContextValue } from "../AuthContext";
import RequireAuth from "../RequireAuth";

function baseAuth(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    login: async () => {},
    logout: async () => {},
    ...overrides,
  };
}

function renderAt(path: string, authValue: AuthContextValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>Halaman Masuk</div>} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <div>Konten Dashboard</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

function ownerUser() {
  return {
    id: 1,
    name: "Owner",
    username: "owner",
    email: null,
    role: "owner" as const,
    is_active: true,
    last_login_at: null,
    created_at: "",
    updated_at: "",
  };
}

describe("RequireAuth", () => {
  it("redirects to login when there is no token", () => {
    const { getByText, queryByText } = renderAt("/dashboard", baseAuth({}));
    expect(getByText("Halaman Masuk")).toBeInTheDocument();
    expect(queryByText("Konten Dashboard")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    const { getByText } = renderAt(
      "/dashboard",
      baseAuth({ token: "tok", user: ownerUser(), isAuthenticated: true })
    );
    expect(getByText("Konten Dashboard")).toBeInTheDocument();
  });

  it("redirects when the token yields no user", () => {
    const { getByText } = renderAt(
      "/dashboard",
      baseAuth({ token: "stale-token", user: null })
    );
    expect(getByText("Halaman Masuk")).toBeInTheDocument();
    expect(localStorage.getItem("ks_token")).toBeNull();
  });

  it("shows a loading state while the session resolves", () => {
    const { getByText } = renderAt(
      "/dashboard",
      baseAuth({ token: "tok", isLoading: true })
    );
    expect(getByText("Memuat sesi…")).toBeInTheDocument();
  });
});
