import { describe, expect, it } from "vitest";
import { loginSchema } from "../validation";

describe("loginSchema", () => {
  it("accepts a valid username and password", () => {
    const result = loginSchema.safeParse({
      username: "kasir1",
      password: "rahasia",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["username"]);
    }
  });

  it("rejects a short username", () => {
    const result = loginSchema.safeParse({ username: "ab", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ username: "kasir1", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["password"]);
    }
  });
});
