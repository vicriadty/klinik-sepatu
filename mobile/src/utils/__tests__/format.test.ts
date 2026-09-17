import { formatDateTimeID, formatIDR } from "../format";

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

describe("formatDateTimeID", () => {
  it("formats ISO timestamps as Indonesian short dates", () => {
    const iso = new Date(2026, 8, 14, 10, 5).toISOString();

    expect(formatDateTimeID(iso)).toBe("14 Sep 2026 10:05");
  });
});
