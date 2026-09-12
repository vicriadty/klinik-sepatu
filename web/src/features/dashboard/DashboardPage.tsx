import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  BoxIcon,
  CheckCircleIcon,
  DollarLineIcon,
  TaskIcon,
  TimeIcon,
} from "../../icons";
import { formatIDR, formatNumberID } from "../../utils/format";
import {
  DEFAULT_PERIOD,
  isPeriodReady,
  type PeriodFilter as PeriodFilterValue,
} from "./period";
import {
  useOrders,
  usePaymentMethods,
  useRevenue,
  useSummary,
  useTopServices,
} from "./useDashboard";
import KpiCard from "./components/KpiCard";
import PeriodFilter from "./components/PeriodFilter";
import QueryState from "./components/QueryState";
import RevenueChart from "./components/RevenueChart";
import OrdersChart from "./components/OrdersChart";
import TopServicesChart from "./components/TopServicesChart";
import PaymentMethodsChart from "./components/PaymentMethodsChart";

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodFilterValue>(DEFAULT_PERIOD);

  const summary = useSummary();
  const revenue = useRevenue(period);
  const orders = useOrders(period);
  const topServices = useTopServices(period);
  const paymentMethods = usePaymentMethods(period);

  const chartsReady = isPeriodReady(period);

  return (
    <>
      <PageMeta
        title="Dashboard | Klinik Sepatu"
        description="Ringkasan performa toko."
      />
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Dashboard
          </h2>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>

        {period.preset === "custom" && !chartsReady ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            Pilih tanggal mulai dan tanggal selesai untuk menampilkan grafik.
          </div>
        ) : null}

        <QueryState
          isLoading={summary.isLoading}
          isError={summary.isError}
          isEmpty={false}
          emptyText=""
          onRetry={() => summary.refetch()}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 md:gap-6">
            {summary.data?.revenue_today !== undefined && (
              <KpiCard
                label="Revenue hari ini"
                value={formatIDR(summary.data.revenue_today)}
                icon={
                  <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
                }
              />
            )}
            <KpiCard
              label="Order hari ini"
              value={formatNumberID(summary.data?.orders_today ?? 0)}
              icon={
                <BoxIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
            />
            <KpiCard
              label="Dalam proses"
              value={formatNumberID(summary.data?.in_progress ?? 0)}
              icon={
                <TaskIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
            />
            <KpiCard
              label="Siap diambil"
              value={formatNumberID(summary.data?.ready_for_pickup ?? 0)}
              icon={
                <CheckCircleIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
            />
            <KpiCard
              label="Outstanding"
              value={formatIDR(summary.data?.outstanding_payment ?? 0)}
              icon={
                <TimeIcon className="text-gray-800 size-6 dark:text-white/90" />
              }
            />
          </div>
        </QueryState>

        {chartsReady && (
          <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
            <ChartCard title="Revenue">
              <QueryState
                isLoading={revenue.isLoading}
                isError={revenue.isError}
                isEmpty={(revenue.data?.length ?? 0) === 0}
                emptyText="Belum ada revenue pada periode ini."
                onRetry={() => revenue.refetch()}
              >
                <RevenueChart data={revenue.data ?? []} />
              </QueryState>
            </ChartCard>
            <ChartCard title="Order">
              <QueryState
                isLoading={orders.isLoading}
                isError={orders.isError}
                isEmpty={(orders.data?.length ?? 0) === 0}
                emptyText="Belum ada order pada periode ini."
                onRetry={() => orders.refetch()}
              >
                <OrdersChart data={orders.data ?? []} />
              </QueryState>
            </ChartCard>
            <ChartCard title="Layanan Teratas">
              <QueryState
                isLoading={topServices.isLoading}
                isError={topServices.isError}
                isEmpty={(topServices.data?.length ?? 0) === 0}
                emptyText="Belum ada layanan terjual pada periode ini."
                onRetry={() => topServices.refetch()}
              >
                <TopServicesChart data={topServices.data ?? []} />
              </QueryState>
            </ChartCard>
            <ChartCard title="Metode Pembayaran">
              <QueryState
                isLoading={paymentMethods.isLoading}
                isError={paymentMethods.isError}
                isEmpty={(paymentMethods.data?.length ?? 0) === 0}
                emptyText="Belum ada pembayaran pada periode ini."
                onRetry={() => paymentMethods.refetch()}
              >
                <PaymentMethodsChart data={paymentMethods.data ?? []} />
              </QueryState>
            </ChartCard>
          </div>
        )}
      </div>
    </>
  );
}
