import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { login } from "../../../api/auth";
import { ApiError } from "../../../api/client";
import { useAuthStore } from "../../../auth/useAuthStore";
import SignInScreen from "../SignInScreen";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../api/auth", () => ({
  login: jest.fn(),
  fetchMe: jest.fn(),
  logout: jest.fn(),
  ROLE_LABELS: { owner: "Owner", admin: "Admin", cashier: "Kasir" },
}));

const loginMock = login as jest.MockedFunction<typeof login>;

const user = {
  id: 1,
  name: "Owner",
  username: "owner",
  email: null,
  role: "owner" as const,
  is_active: true,
  last_login_at: null,
  created_at: "2026-09-10T00:00:00Z",
  updated_at: "2026-09-10T00:00:00Z",
};

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false, gcTime: Infinity },
      queries: { retry: false, gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SignInScreen />
    </QueryClientProvider>
  );
}

async function fillAndSubmit(username: string, password: string) {
  await fireEvent.changeText(
    screen.getByPlaceholderText("cth: kasir1"),
    username
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("Masukkan password"),
    password
  );
  await fireEvent.press(screen.getByRole("button", { name: "Masuk" }));
}

describe("SignInScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ status: "signedOut", user: null });
  });

  it("shows Indonesian validation errors on empty submit", async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Masuk" }));

    expect(await screen.findByText("Username wajib diisi.")).toBeTruthy();
    expect(await screen.findByText("Password wajib diisi.")).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("signs in and stores the token on success", async () => {
    loginMock.mockResolvedValue({ user, token: "tok-login" });
    await renderScreen();

    await fillAndSubmit("owner", "password");

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("signedIn")
    );
    expect(loginMock).toHaveBeenCalledWith("owner", "password");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "ks_token",
      "tok-login"
    );
  });

  it("shows the mapped message when credentials are rejected", async () => {
    loginMock.mockRejectedValue(new ApiError("Invalid credentials.", 401));
    await renderScreen();

    await fillAndSubmit("owner", "salah");

    expect(
      await screen.findByText("Username atau password salah.")
    ).toBeTruthy();
    expect(useAuthStore.getState().status).toBe("signedOut");
  });

  it("shows the deactivated-account message on 403", async () => {
    loginMock.mockRejectedValue(new ApiError("Account deactivated.", 403));
    await renderScreen();

    await fillAndSubmit("owner", "password");

    expect(
      await screen.findByText("Akun dinonaktifkan. Hubungi Owner atau Admin.")
    ).toBeTruthy();
  });
});
