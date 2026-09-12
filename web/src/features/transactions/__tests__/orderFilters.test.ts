import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  parseFilters,
  serializeFilters,
  toListParams,
} from "../orderFilters";

describe("parseFilters", () => {
  it("defaults empty params", () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it("parses all filter fields", () => {
    const parsed = parseFilters(
      new URLSearchParams(
        "page=3&search=ORD&status=RECEIVED&payment_status=PAID&date_from=2026-09-01&date_to=2026-09-30"
      )
    );
    expect(parsed).toEqual({
      page: 3,
      search: "ORD",
      status: "RECEIVED",
      paymentStatus: "PAID",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
    });
  });

  it("clamps invalid pages to 1", () => {
    expect(parseFilters(new URLSearchParams("page=abc")).page).toBe(1);
    expect(parseFilters(new URLSearchParams("page=-2")).page).toBe(1);
  });
});

describe("serializeFilters", () => {
  it("round-trips through parse", () => {
    const filters = {
      page: 2,
      search: "budi",
      status: "ON_PROCESS",
      paymentStatus: "",
      dateFrom: "2026-09-01",
      dateTo: "",
    };
    expect(parseFilters(serializeFilters(filters))).toEqual(filters);
  });

  it("omits empty values but keeps the page", () => {
    const params = serializeFilters(DEFAULT_FILTERS);
    expect(params.toString()).toBe("page=1");
  });
});

describe("toListParams", () => {
  it("drops empty filters for the API call", () => {
    expect(toListParams(DEFAULT_FILTERS)).toEqual({ page: 1, per_page: 15 });
    expect(
      toListParams({ ...DEFAULT_FILTERS, search: "x", status: "RECEIVED" })
    ).toEqual({ page: 1, per_page: 15, search: "x", status: "RECEIVED" });
  });
});
