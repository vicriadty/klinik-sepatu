import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, getToken, setToken } from "../authStorage";

beforeEach(() => {
  localStorage.clear();
});

describe("authStorage", () => {
  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("round-trips a token", () => {
    setToken("secret-token-123");
    expect(getToken()).toBe("secret-token-123");
  });

  it("clears the stored token", () => {
    setToken("secret-token-123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
