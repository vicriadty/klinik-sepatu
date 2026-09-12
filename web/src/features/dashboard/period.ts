export type PeriodPreset = "today" | "7d" | "30d" | "custom";

export interface PeriodFilter {
  preset: PeriodPreset;
  startDate?: string;
  endDate?: string;
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Hari ini",
  "7d": "7 hari",
  "30d": "30 hari",
  custom: "Kustom",
};

export const DEFAULT_PERIOD: PeriodFilter = { preset: "30d" };

export function isPeriodReady(filter: PeriodFilter): boolean {
  return (
    filter.preset !== "custom" ||
    (filter.startDate !== undefined &&
      filter.startDate !== "" &&
      filter.endDate !== undefined &&
      filter.endDate !== "")
  );
}

export function toQueryParams(filter: PeriodFilter): Record<string, string> {
  if (filter.preset === "custom") {
    return {
      period: "custom",
      start_date: filter.startDate ?? "",
      end_date: filter.endDate ?? "",
    };
  }
  return { period: filter.preset };
}
