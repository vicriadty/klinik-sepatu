import { describe, expect, it } from "vitest";
import {
  formatAxisIDR,
  formatDateID,
  formatIDR,
  formatNumberID,
} from "../format";

describe("formatIDR", () => {
  it("formats integer rupiah with dot separators", () => {
    expect(formatIDR(130000)).toBe("Rp130.000");
    expect(formatIDR(25000)).toBe("Rp25.000");
    expect(formatIDR(0)).toBe("Rp0");
  });

  it("rounds fractional values", () => {
    expect(formatIDR(130000.6)).toBe("Rp130.001");
  });
});

describe("formatNumberID", () => {
  it("formats counts with dot separators", () => {
    expect(formatNumberID(12)).toBe("12");
    expect(formatNumberID(1350)).toBe("1.350");
  });
});

describe("formatDateID", () => {
  it("formats ISO dates in Indonesian", () => {
    expect(formatDateID("2026-09-12")).toBe("12 Sep 2026");
  });
});

describe("formatAxisIDR", () => {
  it("abbreviates axis values", () => {
    expect(formatAxisIDR(500)).toBe("500");
    expect(formatAxisIDR(2500)).toBe("2,5 rb");
    expect(formatAxisIDR(25000)).toBe("25 rb");
    expect(formatAxisIDR(1500000)).toBe("1,5 jt");
    expect(formatAxisIDR(20000000)).toBe("20 jt");
  });
});
