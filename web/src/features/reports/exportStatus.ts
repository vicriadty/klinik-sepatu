import type { ExportStatus } from "../../services/reportApi";

export const EXPORT_STATUS_LABELS: Record<ExportStatus, string> = {
  PENDING: "Menunggu",
  PROCESSING: "Diproses",
  COMPLETED: "Selesai",
  FAILED: "Gagal",
};

export function isExportTerminal(status: ExportStatus): boolean {
  return status === "COMPLETED" || status === "FAILED";
}

export function exportFilename(
  type: string,
  exportId: number,
  date: Date = new Date()
): string {
  const stamp = date
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, "");
  return `${type}_${exportId}_${stamp}.xlsx`;
}
