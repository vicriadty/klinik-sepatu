import { describe, expect, it } from "vitest";
import {
  EXPORT_STATUS_LABELS,
  exportFilename,
  isExportTerminal,
} from "../exportStatus";

describe("isExportTerminal", () => {
  it("treats completed and failed as terminal", () => {
    expect(isExportTerminal("COMPLETED")).toBe(true);
    expect(isExportTerminal("FAILED")).toBe(true);
  });

  it("keeps polling pending and processing states", () => {
    expect(isExportTerminal("PENDING")).toBe(false);
    expect(isExportTerminal("PROCESSING")).toBe(false);
  });
});

describe("EXPORT_STATUS_LABELS", () => {
  it("labels every export status in Indonesian", () => {
    expect(EXPORT_STATUS_LABELS).toEqual({
      PENDING: "Menunggu",
      PROCESSING: "Diproses",
      COMPLETED: "Selesai",
      FAILED: "Gagal",
    });
  });
});

describe("exportFilename", () => {
  it("builds a timestamped xlsx name", () => {
    expect(exportFilename("transactions", 7, new Date("2026-09-12T10:00:00Z"))).toBe(
      "transactions_7_20260912100000.xlsx"
    );
  });
});
