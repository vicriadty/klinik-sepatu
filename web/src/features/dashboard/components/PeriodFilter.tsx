import { PERIOD_LABELS, type PeriodFilter, type PeriodPreset } from "../period";
import DateField from "../../../components/form/DateField";

interface PeriodFilterProps {
  value: PeriodFilter;
  onChange: (filter: PeriodFilter) => void;
}

const PRESETS: PeriodPreset[] = ["today", "7d", "30d", "custom"];

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange({ preset })}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              value.preset === preset
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            }`}
          >
            {PERIOD_LABELS[preset]}
          </button>
        ))}
      </div>
      {value.preset === "custom" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DateField
            id="period-start"
            label="Tanggal mulai"
            value={value.startDate ?? ""}
            max={value.endDate || undefined}
            onChange={(startDate) => onChange({ ...value, startDate })}
          />
          <DateField
            id="period-end"
            label="Tanggal selesai"
            value={value.endDate ?? ""}
            min={value.startDate || undefined}
            onChange={(endDate) => onChange({ ...value, endDate })}
          />
        </div>
      )}
    </div>
  );
}
