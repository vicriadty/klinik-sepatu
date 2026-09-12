import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import QueryState from "../dashboard/components/QueryState";
import PeriodFilter from "../dashboard/components/PeriodFilter";
import {
  DEFAULT_PERIOD,
  isPeriodReady,
  toQueryParams,
  type PeriodFilter as PeriodFilterValue,
} from "../dashboard/period";
import { formatDateID, formatIDR, formatNumberID } from "../../utils/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "../transactions/statusMeta";
import type { ReportFilterParams, ReportType, TransactionRow } from "../../services/reportApi";
import { REPORT_LABELS } from "../../services/reportApi";
import {
  useCustomersReport,
  useDownloadExport,
  useExportStatus,
  useRequestExport,
  useRevenueReport,
  useServicesReport,
  useServiceOptions,
  useTransactionsReport,
} from "./useReports";
import ExportCard from "./components/ExportCard";

const REPORT_TYPES: ReportType[] = [
  "transactions",
  "revenue",
  "services",
  "customers",
];

const PAYMENT_METHODS = ["CASH", "QRIS", "TRANSFER"];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("transactions");
  const [period, setPeriod] = useState<PeriodFilterValue>(DEFAULT_PERIOD);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [exportId, setExportId] = useState<number | null>(null);

  const filtersReady = isPeriodReady(period);
  const baseParams: ReportFilterParams = filtersReady
    ? {
        ...toQueryParams(period),
        ...(paymentMethod !== "" ? { payment_method: paymentMethod } : {}),
        ...(serviceId !== "" ? { service_id: Number(serviceId) } : {}),
      }
    : {};

  const transactions = useTransactionsReport(baseParams);
  const revenue = useRevenueReport(baseParams);
  const services = useServicesReport(baseParams);
  const customers = useCustomersReport(baseParams);
  const serviceOptions = useServiceOptions();
  const requestExport = useRequestExport();
  const exportStatus = useExportStatus(exportId);
  const download = useDownloadExport();

  const startExport = () => {
    setExportId(null);
    requestExport.mutate(
      { type: reportType, filters: baseParams },
      {
        onSuccess: (record) => setExportId(record.id),
      }
    );
  };

  const activeExport = exportStatus.data ?? null;

  return (
    <>
      <PageMeta
        title="Laporan | Klinik Sepatu"
        description="Laporan transaksi, revenue, layanan, dan customer."
      />
      <div className="flex flex-col gap-4 md:gap-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Laporan
        </h2>

        <div className="flex flex-wrap gap-2">
          {REPORT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setReportType(type);
                setExportId(null);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                reportType === type
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              }`}
            >
              {REPORT_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2">
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Metode bayar
              </span>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:text-white/90"
              >
                <option value="">Semua</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Layanan</span>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:text-white/90"
              >
                <option value="">Semua</option>
                {(serviceOptions.data ?? []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={startExport}
              disabled={!filtersReady || requestExport.isPending}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-40"
            >
              {requestExport.isPending ? "Meminta…" : "Export Excel"}
            </button>
            {requestExport.isError && (
              <p role="alert" className="text-sm text-error-500">
                Gagal meminta export. Coba lagi.
              </p>
            )}
            {period.preset === "custom" && !filtersReady && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pilih tanggal mulai dan selesai untuk melihat laporan.
              </p>
            )}
          </div>
        </div>

        {activeExport && (
          <ExportCard
            status={activeExport.status}
            error={activeExport.error}
            downloading={download.isPending}
            onDownload={() =>
              download.mutate({ id: activeExport.id, type: activeExport.type })
            }
          />
        )}

        {filtersReady && reportType === "transactions" && (
          <TransactionsView
            rows={transactions.data?.data ?? []}
            total={transactions.data?.meta.total ?? 0}
            isLoading={transactions.isLoading}
            isError={transactions.isError}
            onRetry={() => transactions.refetch()}
          />
        )}
        {filtersReady && reportType === "revenue" && (
          <RevenueView
            summary={revenue.data ?? null}
            isLoading={revenue.isLoading}
            isError={revenue.isError}
            onRetry={() => revenue.refetch()}
          />
        )}
        {filtersReady && reportType === "services" && (
          <ServicesView
            rows={services.data ?? []}
            isLoading={services.isLoading}
            isError={services.isError}
            onRetry={() => services.refetch()}
          />
        )}
        {filtersReady && reportType === "customers" && (
          <CustomersView
            rows={customers.data ?? []}
            isLoading={customers.isLoading}
            isError={customers.isError}
            onRetry={() => customers.refetch()}
          />
        )}
      </div>
    </>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-800 dark:border-gray-800 dark:text-white/90">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TransactionsView({
  rows,
  total,
  isLoading,
  isError,
  onRetry,
}: {
  rows: TransactionRow[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <Card title={`Transaksi (${formatNumberID(total)} baris)`}>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={rows.length === 0}
        emptyText="Tidak ada transaksi pada filter ini."
        onRetry={onRetry}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {[
                  "Order",
                  "Tanggal",
                  "Customer",
                  "Layanan",
                  "Qty",
                  "Subtotal",
                  "Diskon",
                  "Total",
                  "Bayar",
                  "Status",
                ].map((head) => (
                  <th key={head} className="px-4 py-3 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.order_number}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="px-4 py-2.5 font-medium">{row.order_number}</td>
                  <td className="px-4 py-2.5">{formatDateID(row.date)}</td>
                  <td className="px-4 py-2.5">{row.customer ?? "—"}</td>
                  <td className="px-4 py-2.5">{row.service || "—"}</td>
                  <td className="px-4 py-2.5">{row.qty}</td>
                  <td className="px-4 py-2.5">{formatIDR(row.subtotal)}</td>
                  <td className="px-4 py-2.5">{formatIDR(row.discount)}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {formatIDR(row.grand_total)}
                  </td>
                  <td className="px-4 py-2.5">
                    {row.payment_method || "—"} ·{" "}
                    {PAYMENT_STATUS_LABELS[
                      row.payment_status as keyof typeof PAYMENT_STATUS_LABELS
                    ] ?? row.payment_status}
                  </td>
                  <td className="px-4 py-2.5">
                    {ORDER_STATUS_LABELS[
                      row.order_status as keyof typeof ORDER_STATUS_LABELS
                    ] ?? row.order_status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </Card>
  );
}

function RevenueView({
  summary,
  isLoading,
  isError,
  onRetry,
}: {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_discount: number;
    total_collected: number;
    total_outstanding: number;
  } | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <Card title="Ringkasan Revenue">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={summary === null}
        emptyText="Tidak ada data."
        onRetry={onRetry}
      >
        {summary && (
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Total revenue", formatIDR(summary.total_revenue)],
              ["Total order", formatNumberID(summary.total_orders)],
              ["Total diskon", formatIDR(summary.total_discount)],
              ["Terkumpul", formatIDR(summary.total_collected)],
              ["Outstanding", formatIDR(summary.total_outstanding)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-gray-50 p-4 dark:bg-white/5"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {label}
                </p>
                <p className="mt-1 font-bold text-gray-800 dark:text-white/90">
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </Card>
  );
}

function ServicesView({
  rows,
  isLoading,
  isError,
  onRetry,
}: {
  rows: {
    service_id: number;
    service_name: string;
    category_name: string | null;
    orders_count: number;
    items_count: number;
    revenue: number;
  }[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <Card title="Performa Layanan">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={rows.length === 0}
        emptyText="Tidak ada layanan terjual pada filter ini."
        onRetry={onRetry}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {["Layanan", "Kategori", "Order", "Item", "Revenue"].map(
                  (head) => (
                    <th key={head} className="px-4 py-3 font-medium">
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.service_id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="px-4 py-2.5 font-medium">
                    {row.service_name}
                  </td>
                  <td className="px-4 py-2.5">{row.category_name ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {formatNumberID(row.orders_count)}
                  </td>
                  <td className="px-4 py-2.5">
                    {formatNumberID(row.items_count)}
                  </td>
                  <td className="px-4 py-2.5">{formatIDR(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </Card>
  );
}

function CustomersView({
  rows,
  isLoading,
  isError,
  onRetry,
}: {
  rows: {
    customer_id: number;
    name: string;
    phone: string;
    orders_count: number;
    total_spent: number;
  }[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <Card title="Performa Customer">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={rows.length === 0}
        emptyText="Tidak ada customer pada filter ini."
        onRetry={onRetry}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {["Customer", "Telepon", "Order", "Total belanja"].map(
                  (head) => (
                    <th key={head} className="px-4 py-3 font-medium">
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.customer_id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="px-4 py-2.5 font-medium">{row.name}</td>
                  <td className="px-4 py-2.5">{row.phone}</td>
                  <td className="px-4 py-2.5">
                    {formatNumberID(row.orders_count)}
                  </td>
                  <td className="px-4 py-2.5">
                    {formatIDR(row.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </Card>
  );
}
