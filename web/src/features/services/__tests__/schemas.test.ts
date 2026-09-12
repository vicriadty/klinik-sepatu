import { describe, expect, it } from "vitest";
import { categorySchema, serviceSchema } from "../schemas";

const validService = {
  name: "Deep Clean",
  category_id: 1,
  price: 35000,
  active: true,
};

describe("serviceSchema", () => {
  it("accepts a complete valid service", () => {
    expect(serviceSchema.safeParse(validService).success).toBe(true);
  });

  it("rejects missing name, category, and negative price", () => {
    const result = serviceSchema.safeParse({
      name: "",
      price: -5000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("name");
      expect(paths).toContain("category_id");
      expect(paths).toContain("price");
    }
  });

  it("accepts nullable optionals", () => {
    const result = serviceSchema.safeParse({
      ...validService,
      description: null,
      estimated_duration_days: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("categorySchema", () => {
  it("accepts a name and rejects emptiness", () => {
    expect(categorySchema.safeParse({ name: "Express" }).success).toBe(true);
    expect(categorySchema.safeParse({ name: "" }).success).toBe(false);
  });
});
