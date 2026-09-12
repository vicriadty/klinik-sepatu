import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERIOD,
  isPeriodReady,
  toQueryParams,
} from "../period";

describe("toQueryParams", () => {
  it("maps presets to the period param", () => {
    expect(toQueryParams({ preset: "today" })).toEqual({ period: "today" });
    expect(toQueryParams({ preset: "7d" })).toEqual({ period: "7d" });
    expect(toQueryParams({ preset: "30d" })).toEqual({ period: "30d" });
  });

  it("maps custom ranges to date params", () => {
    expect(
      toQueryParams({
        preset: "custom",
        startDate: "2026-09-01",
        endDate: "2026-09-07",
      })
    ).toEqual({
      period: "custom",
      start_date: "2026-09-01",
      end_date: "2026-09-07",
    });
  });

  it("defaults to the 30-day preset", () => {
    expect(DEFAULT_PERIOD).toEqual({ preset: "30d" });
  });
});

describe("isPeriodReady", () => {
  it("is ready for presets without dates", () => {
    expect(isPeriodReady({ preset: "today" })).toBe(true);
    expect(isPeriodReady({ preset: "30d" })).toBe(true);
  });

  it("requires both dates for custom ranges", () => {
    expect(isPeriodReady({ preset: "custom" })).toBe(false);
    expect(
      isPeriodReady({ preset: "custom", startDate: "2026-09-01" })
    ).toBe(false);
    expect(
      isPeriodReady({
        preset: "custom",
        startDate: "2026-09-01",
        endDate: "2026-09-07",
      })
    ).toBe(true);
  });
});
