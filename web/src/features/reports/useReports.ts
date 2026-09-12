import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  downloadExportBlob,
  fetchCustomersReport,
  fetchExport,
  fetchRevenueReport,
  fetchServicesReport,
  fetchTransactionsReport,
  requestExport,
  saveBlob,
  type ReportFilterParams,
  type ReportType,
} from "../../services/reportApi";
import { fetchServiceOptions } from "../../services/serviceApi";
import { exportFilename, isExportTerminal } from "./exportStatus";

export function useTransactionsReport(params: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "transactions", params],
    queryFn: () => fetchTransactionsReport({ ...params, per_page: 100 }),
  });
}

export function useRevenueReport(params: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "revenue", params],
    queryFn: () => fetchRevenueReport(params),
  });
}

export function useServicesReport(params: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "services", params],
    queryFn: () => fetchServicesReport(params),
  });
}

export function useCustomersReport(params: ReportFilterParams) {
  return useQuery({
    queryKey: ["reports", "customers", params],
    queryFn: () => fetchCustomersReport(params),
  });
}

export function useRequestExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, filters }: { type: ReportType; filters: ReportFilterParams }) =>
      requestExport(type, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-exports"] });
    },
  });
}

export function useExportStatus(exportId: number | null) {
  return useQuery({
    queryKey: ["report-exports", exportId],
    queryFn: () => fetchExport(exportId ?? 0),
    enabled: exportId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === undefined || isExportTerminal(status)) {
        return false;
      }
      return 2000;
    },
  });
}

export function useServiceOptions() {
  return useQuery({
    queryKey: ["services", "options"],
    queryFn: fetchServiceOptions,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: async ({ id, type }: { id: number; type: ReportType }) => {
      const blob = await downloadExportBlob(id);
      saveBlob(blob, exportFilename(type, id));
    },
  });
}
