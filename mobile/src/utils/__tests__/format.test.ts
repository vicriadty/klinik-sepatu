import { formatIDR } from "../format";

describe("formatIDR", () => {
  it("groups thousands with dots", () => {
    expect(formatIDR(54000)).toBe("Rp54.000");
    expect(formatIDR(1234567)).toBe("Rp1.234.567");
  });

  it("rounds decimals and handles zero", () => {
    expect(formatIDR(0)).toBe("Rp0");
    expect(formatIDR(1500.6)).toBe("Rp1.501");
  });
});
