import Button from "../../../components/ui/button/Button";
import type { ExportStatus } from "../../../services/reportApi";
import { EXPORT_STATUS_LABELS } from "../exportStatus";

interface ExportCardProps {
  status: ExportStatus;
  error: string | null;
  downloading: boolean;
  onDownload: () => void;
}

const STATUS_STYLES: Record<ExportStatus, string> = {
  PENDING: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
  PROCESSING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
};

export default function ExportCard({
  status,
  error,
  downloading,
  onDownload,
}: ExportCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {EXPORT_STATUS_LABELS[status]}
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {status === "COMPLETED" &&
            "File Excel siap diunduh."}
          {status === "PROCESSING" &&
            "Backend sedang menyusun file…"}
          {status === "PENDING" &&
            "Permintaan export masuk antrean…"}
          {status === "FAILED" &&
            `Export gagal${error ? `: ${error}` : "."}`}
        </p>
      </div>
      {status === "COMPLETED" && (
        <div className="sm:ml-auto">
          <Button
            size="sm"
            disabled={downloading}
            onClick={onDownload}
          >
            {downloading ? "Mengunduh…" : "Download Excel"}
          </Button>
        </div>
      )}
    </div>
  );
}
