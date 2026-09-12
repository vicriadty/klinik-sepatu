import { api } from "./api";

export type ReportType = "transactions" | "revenue" | "services" | "customers";

export const REPORT_LABELS: Record<ReportType, string> = {
  transactions: "Transaksi",
  revenue: "Revenue",
  services: "Layanan",
  customers: "Customer",
};

export interface RevenueSummary {
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_orders: number;
  total_discount: number;
  total_collected: number;
  total_outstanding: number;
}

export interface ServiceRow {
  service_id: number;
  service_name: string;
  category_name: string | null;
  orders_count: number;
  items_count: number;
  revenue: number;
}

export interface CustomerRow {
  customer_id: number;
  name: string;
  phone: string;
  orders_count: number;
  total_spent: number;
}

export type ExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ReportExport {
  id: number;
  type: ReportType;
  filters: Record<string, unknown>;
  status: ExportStatus;
  error: string | null;
  download_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportFilterParams {
  start_date?: string;
  end_date?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  service_id?: number;
  search?: string;
  per_page?: number;
}

export interface TransactionRow {
  order_number: string;
  date: string;
  customer: string | null;
  service: string;
  qty: number;
  subtotal: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
}

export interface PaginatedRows<T> {
  data: T[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}

export async function fetchTransactionsReport(
  params: ReportFilterParams
): Promise<PaginatedRows<TransactionRow>> {
  const response = await api.get<PaginatedRows<TransactionRow>>(
    "/reports/transactions",
    { params }
  );
  return response.data;
}

export async function fetchRevenueReport(
  params: ReportFilterParams
): Promise<RevenueSummary> {
  const response = await api.get<{ data: RevenueSummary }>(
    "/reports/revenue",
    { params }
  );
  return response.data.data;
}

export async function fetchServicesReport(
  params: ReportFilterParams
): Promise<ServiceRow[]> {
  const response = await api.get<{ data: ServiceRow[] }>(
    "/reports/services",
    { params }
  );
  return response.data.data;
}

export async function fetchCustomersReport(
  params: ReportFilterParams
): Promise<CustomerRow[]> {
  const response = await api.get<{ data: CustomerRow[] }>(
    "/reports/customers",
    { params }
  );
  return response.data.data;
}

export async function requestExport(
  type: ReportType,
  filters: ReportFilterParams
): Promise<ReportExport> {
  const response = await api.post<{ data: ReportExport }>(
    "/reports/exports",
    { type, ...filters }
  );
  return response.data.data;
}

export async function fetchExport(id: number): Promise<ReportExport> {
  const response = await api.get<{ data: ReportExport }>(
    `/reports/exports/${id}`
  );
  return response.data.data;
}

export async function downloadExportBlob(exportId: number): Promise<Blob> {
  const response = await api.get(
    `/reports/exports/${exportId}/download`,
    { responseType: "blob" }
  );
  return response.data as Blob;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
