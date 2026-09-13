import { describe, expect, it } from "vitest";
import { settingsSchema } from "../schemas";

describe("settingsSchema", () => {
  it("accepts a complete valid payload", () => {
    expect(
      settingsSchema.safeParse({
        store_name: "Klinik Sepatu Tebet",
        store_phone: "0812000111",
        store_address: "Jl. Merdeka 10",
        receipt_footer: "Terima kasih!",
        timezone: "Asia/Jakarta",
      }).success
    ).toBe(true);
  });

  it("rejects an empty store name and bad timezone", () => {
    const result = settingsSchema.safeParse({
      store_name: "",
      timezone: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toContain("store_name");
      expect(paths).toContain("timezone");
    }
  });

  it("accepts null optionals", () => {
    const result = settingsSchema.safeParse({
      store_name: "X",
      store_phone: null,
      timezone: "Asia/Makassar",
    });
    expect(result.success).toBe(true);
  });
});
