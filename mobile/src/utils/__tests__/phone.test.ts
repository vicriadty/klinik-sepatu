import { displayPhone, normalizePhone } from "../phone";

describe("normalizePhone", () => {
  it("normalizes local 08 numbers to 62", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("6281234567890");
    expect(normalizePhone("08123456789")).toBe("628123456789");
  });

  it("normalizes numbers already starting with 8", () => {
    expect(normalizePhone("81234567890")).toBe("6281234567890");
  });

  it("keeps +62 numbers", () => {
    expect(normalizePhone("+62 812 3456 7890")).toBe("6281234567890");
  });

  it("rejects landlines and foreign numbers", () => {
    expect(normalizePhone("021-555-1234")).toBeNull();
    expect(normalizePhone("+1 555 123 4567")).toBeNull();
  });

  it("rejects empty and too-short input", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("0812")).toBeNull();
  });

  it("formats canonical numbers for display", () => {
    expect(displayPhone("6281234567890")).toBe("+6281234567890");
  });
});
