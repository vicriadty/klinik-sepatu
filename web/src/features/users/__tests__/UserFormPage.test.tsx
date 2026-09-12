import { describe, expect, it, vi } from "vitest";
import { findByText, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthContext, type AuthContextValue } from "../../auth/AuthContext";
import type { ApiUser } from "../../../services/authApi";
import UserFormPage from "../UserFormPage";

vi.mock("../../../services/userApi", () => ({
  fetchUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

function staffUser(role: ApiUser["role"]): ApiUser {
  return {
    id: 1,
    name: "Pemilik",
    username: "owner",
    email: null,
    role,
    is_active: true,
    last_login_at: null,
    created_at: "",
    updated_at: "",
  };
}

function renderAs(role: ApiUser["role"], path: string) {
  const user = staffUser(role);
  const authValue: AuthContextValue = {
    user,
    token: "tok",
    isLoading: false,
    isAuthenticated: true,
    login: async () => {},
    logout: async () => {},
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/users/new" element={<UserFormPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

describe("UserFormPage", () => {
  it("shows validation errors on empty submit", async () => {
    const { getByText } = renderAs("owner", "/users/new");

    await userEvent.click(getByText("Tambah"));

    expect(await findByText(document.body, "Nama wajib diisi."))
      .toBeInTheDocument();
    expect(getByText("Username wajib diisi.")).toBeInTheDocument();
  });

  it("hides the owner role from admins", async () => {
    const { queryByText, getByText } = renderAs("admin", "/users/new");

    expect(await findByText(document.body, "Tambah User")).toBeInTheDocument();
    expect(getByText("Admin")).toBeInTheDocument();
    expect(queryByText("Owner")).toBeNull();
  });

  it("shows all roles to owners", async () => {
    const { getByText } = renderAs("owner", "/users/new");

    expect(await findByText(document.body, "Tambah User")).toBeInTheDocument();
    expect(getByText("Owner")).toBeInTheDocument();
  });
});
