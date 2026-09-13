import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import DateField from "../../components/form/DateField";
import { EyeIcon } from "../../icons";
import QueryState from "../dashboard/components/QueryState";
import { formatDateID, formatIDR } from "../../utils/format";
import { useOrdersList } from "./useOrders";
import {
  ALL_ORDER_STATUSES,
  ALL_PAYMENT_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from "./statusMeta";
import {
  parseFilters,
  serializeFilters,
  toListParams,
  type OrderFilters,
} from "./orderFilters";

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TransactionListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const filters = parseFilters(searchParams);
  const [searchInput, setSearchInput] = useState(filters.search);

  const update = (patch: Partial<OrderFilters>, resetPage = true) => {
    const next: OrderFilters = {
      ...filters,
      ...patch,
      page: resetPage ? 1 : patch.page ?? filters.page,
    };
    setSearchParams(serializeFilters(next), { replace: true });
  };

  useEffect(() => {
    setSearchInput(filters.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        update({ search: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const listQuery = useOrdersList(toListParams(filters));
  const rows = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  return (
    <>
      <PageMeta
        title="Transaksi | Klinik Sepatu"
        description="Daftar transaksi order."
      />
      <div className="flex flex-col gap-4 md:gap-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Transaksi
        </h2>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Cari</span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nomor order / customer"
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:text-white/90"
              />
            </label>
            <FilterSelect
              label="Status order"
              value={filters.status}
              onChange={(status) => update({ status })}
              options={ALL_ORDER_STATUSES.map((status) => ({
                value: status,
                label: ORDER_STATUS_LABELS[status],
              }))}
              allLabel="Semua status"
            />
            <FilterSelect
              label="Status bayar"
              value={filters.paymentStatus}
              onChange={(paymentStatus) => update({ paymentStatus })}
              options={ALL_PAYMENT_STATUSES.map((status) => ({
                value: status,
                label: PAYMENT_STATUS_LABELS[status],
              }))}
              allLabel="Semua"
            />
            <DateField
              id="filter-date-from"
              label="Dari tanggal"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(dateFrom) => update({ dateFrom })}
            />
            <DateField
              id="filter-date-to"
              label="Sampai tanggal"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(dateTo) => update({ dateTo })}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <QueryState
            isLoading={listQuery.isLoading}
            isError={listQuery.isError}
            isEmpty={rows.length === 0}
            emptyText="Tidak ada transaksi yang cocok dengan filter."
            onRetry={() => listQuery.refetch()}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Nomor Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Bayar</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Dibuat</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">{order.customer.name}</td>
                      <td className="px-4 py-3">{order.items_count} pasang</td>
                      <td className="px-4 py-3">
                        {formatIDR(order.grand_total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${PAYMENT_STATUS_STYLES[order.payment_status]}`}
                        >
                          {PAYMENT_STATUS_LABELS[order.payment_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDateID(order.created_at.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          title="Lihat detail"
                          aria-label={`Lihat detail ${order.order_number}`}
                          onClick={() => navigate(`/transactions/${order.id}`)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-brand-500 hover:bg-brand-500/10 hover:text-brand-600 dark:text-brand-400"
                        >
                          <EyeIcon className="size-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">
                  Halaman {meta.page} dari {meta.last_page} ({meta.total}{" "}
                  transaksi)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => update({ page: meta.page - 1 }, false)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.last_page}
                    onClick={() => update({ page: meta.page + 1 }, false)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </QueryState>
        </div>
      </div>
    </>
  );
}
