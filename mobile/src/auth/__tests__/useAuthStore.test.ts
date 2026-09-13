import * as SecureStore from "expo-secure-store";
import { fetchMe } from "../../api/auth";
import { ApiError } from "../../api/client";
import { useAuthStore } from "../useAuthStore";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("../../api/auth", () => ({
  fetchMe: jest.fn(),
}));

const getItemAsync = SecureStore.getItemAsync as jest.Mock;
const setItemAsync = SecureStore.setItemAsync as jest.Mock;
const deleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;
const fetchMeMock = fetchMe as jest.MockedFunction<typeof fetchMe>;

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

describe("useAuthStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ status: "restoring", user: null });
  });

  it("restores a session from the stored token", async () => {
    getItemAsync.mockResolvedValue("tok-123");
    fetchMeMock.mockResolvedValue(user);

    await useAuthStore.getState().restore();

    expect(fetchMeMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe("signedIn");
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("signs out when there is no stored token", async () => {
    getItemAsync.mockResolvedValue(null);

    await useAuthStore.getState().restore();

    expect(fetchMeMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("signedOut");
  });

  it("clears the stored token when the server rejects it", async () => {
    getItemAsync.mockResolvedValue("tok-expired");
    fetchMeMock.mockRejectedValue(new ApiError("Unauthenticated.", 401));

    await useAuthStore.getState().restore();

    expect(deleteItemAsync).toHaveBeenCalledWith("ks_token");
    expect(useAuthStore.getState().status).toBe("signedOut");
  });

  it("keeps the stored token on a network failure", async () => {
    getItemAsync.mockResolvedValue("tok-123");
    fetchMeMock.mockRejectedValue(
      new ApiError("Tidak dapat terhubung ke server.")
    );

    await useAuthStore.getState().restore();

    expect(deleteItemAsync).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("signedOut");
  });

  it("persists the token on sign in and removes it on sign out", async () => {
    await useAuthStore.getState().signIn(user, "tok-new");

    expect(setItemAsync).toHaveBeenCalledWith("ks_token", "tok-new");
    expect(useAuthStore.getState().status).toBe("signedIn");

    await useAuthStore.getState().signOut();

    expect(deleteItemAsync).toHaveBeenCalledWith("ks_token");
    expect(useAuthStore.getState().status).toBe("signedOut");
    expect(useAuthStore.getState().user).toBeNull();
  });
});
