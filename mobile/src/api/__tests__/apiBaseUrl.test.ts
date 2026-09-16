import Constants from "expo-constants";
import { getApiBaseUrl } from "../client";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: "192.168.1.50:8081" } },
}));

describe("getApiBaseUrl", () => {
  const original = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = original;
    (Constants as { expoConfig: unknown }).expoConfig = {
      hostUri: "192.168.1.50:8081",
    };
  });

  it("derives the API host from the Metro dev server", () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(getApiBaseUrl()).toBe("http://192.168.1.50:8000/api/v1");
  });

  it("prefers the explicit env override", () => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com/api/v1";

    expect(getApiBaseUrl()).toBe("https://api.example.com/api/v1");
  });

  it("falls back to the Android emulator host without Metro info", () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    (Constants as { expoConfig: unknown }).expoConfig = null;

    expect(getApiBaseUrl()).toBe("http://10.0.2.2:8000/api/v1");
  });
});
