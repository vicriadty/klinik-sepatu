import { describe, expect, it } from "vitest";
import {
  availableRoles,
  createUserSchema,
  updateUserSchema,
} from "../schemas";

const validCreate = {
  name: "Budi Santoso",
  username: "budi_kasir",
  role: "cashier" as const,
  password: "rahasia-kuat-123",
};

describe("createUserSchema", () => {
  it("accepts a complete valid user", () => {
    expect(createUserSchema.safeParse(validCreate).success).toBe(true);
  });

  it("rejects missing name, short username, and short password", () => {
    const result = createUserSchema.safeParse({
      name: "",
      username: "ab",
      role: "cashier",
      password: "pendek",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("name");
      expect(paths).toContain("username");
      expect(paths).toContain("password");
    }
  });

  it("rejects usernames with illegal characters", () => {
    const result = createUserSchema.safeParse({
      ...validCreate,
      username: "budi kasir!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown roles", () => {
    const result = createUserSchema.safeParse({
      ...validCreate,
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("allows an empty password (means unchanged)", () => {
    const result = updateUserSchema.safeParse({
      name: "X",
      role: "cashier",
      password: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short non-empty password", () => {
    const result = updateUserSchema.safeParse({
      name: "X",
      role: "cashier",
      password: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("availableRoles", () => {
  it("gives owners every role", () => {
    expect(availableRoles("owner")).toEqual(["owner", "admin", "cashier"]);
  });

  it("hides the owner role from admins and others", () => {
    expect(availableRoles("admin")).toEqual(["admin", "cashier"]);
    expect(availableRoles("cashier")).toEqual(["admin", "cashier"]);
    expect(availableRoles(undefined)).toEqual(["admin", "cashier"]);
  });
});
