import { useState } from "react";
import { useParams } from "react-router";
import axios from "axios";
import PageMeta from "../../components/common/PageMeta";
import ActionAlert from "../../components/common/ActionAlert";
import Button from "../../components/ui/button/Button";
import QueryState from "../dashboard/components/QueryState";
import {
  formatDateID,
  formatIDR,
  formatNumberID,
} from "../../utils/format";
import { toApiError } from "../../services/api";
import type { OrderStatus } from "../../services/orderApi";
import {
  useCancelOrder,
  useChangeOrderStatus,
  useOrder,
} from "./useOrders";
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from "./statusMeta";

function Section({
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

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-800 dark:text-white/90">
        {value}
      </span>
    </div>
  );
}

export default function TransactionDetailPage() {
  const { id = "" } = useParams();
  const detailQuery = useOrder(id);
  const order = detailQuery.data ?? null;

  const [targetStatus, setTargetStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const statusMutation = useChangeOrderStatus(id);
  const cancelMutation = useCancelOrder(id);
  const isPending = statusMutation.isPending || cancelMutation.isPending;

  const submitStatus = () => {
    if (targetStatus === "") return;
    setActionError(null);
    const run =
      targetStatus === "CANCELLED"
        ? cancelMutation.mutateAsync(note || undefined)
        : statusMutation.mutateAsync({ status: targetStatus, note: note || undefined });
    run.then(
      () => {
        setTargetStatus("");
        setNote("");
        detailQuery.refetch();
      },
      (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          setActionError("Anda tidak memiliki akses untuk aksi ini.");
          return;
        }
        const apiError = toApiError(error, "Terjadi kesalahan server.");
        setActionError(apiError.message);
      }
    );
  };

  const isNotFound =
    detailQuery.isError &&
    axios.isAxiosError(detailQuery.error) &&
    detailQuery.error.response?.status === 404;

  return (
    <>
      <PageMeta
        title="Detail Transaksi | Klinik Sepatu"
        description="Rincian transaksi order."
      />
      <QueryState
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        isEmpty={order === null}
        emptyText={
          isNotFound ? "Transaksi tidak ditemukan." : "Data tidak tersedia."
        }
        onRetry={() => detailQuery.refetch()}
      >
        {order && (
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                  {order.order_number}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dibuat {formatDateID(order.created_at.slice(0, 10))} ·{" "}
                  {order.items_count} pasang
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_STATUS_STYLES[order.payment_status]}`}
                >
                  {PAYMENT_STATUS_LABELS[order.payment_status]}
                </span>
              </div>
            </div>

            <Section title="Ubah Status">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex flex-col gap-1 text-sm sm:w-64">
                  <span className="text-gray-500 dark:text-gray-400">
                    Status tujuan
                  </span>
                  <select
                    value={targetStatus}
                    onChange={(event) =>
                      setTargetStatus(event.target.value as OrderStatus)
                    }
                    disabled={isPending}
                    className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
                  >
                    <option value="">Pilih status…</option>
                    {ALL_ORDER_STATUSES.filter((s) => s !== order.status).map(
                      (status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Catatan (wajib diisi alasan bila membatalkan)
                  </span>
                  <input
                    type="text"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="cth: Customer minta batal via WA"
                    disabled={isPending}
                    className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:text-white/90"
                  />
                </label>
                <Button
                  size="sm"
                  disabled={targetStatus === "" || isPending}
                  onClick={submitStatus}
                >
                  {isPending ? "Memproses…" : "Simpan"}
                </Button>
              </div>
              {actionError && (
                <ActionAlert
                  variant="error"
                  title="Gagal"
                  message={actionError}
                  onClose={() => setActionError(null)}
                />
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Aturan backend berlaku: Selesai wajib lunas; batal hanya
                dari Diterima/Diproses dan wajib refund bila sudah ada
                pembayaran.
              </p>
            </Section>

            <Section title="Customer">
              <Definition label="Nama" value={order.customer.name} />
              <Definition label="Telepon" value={order.customer.phone} />
            </Section>

            <Section title={`Sepatu (${order.items_count} pasang)`}>
              <div className="flex flex-col gap-5">
                {order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <p className="font-semibold text-gray-800 dark:text-white/90">
                      #{index + 1} {item.brand}
                      {item.model ? ` ${item.model}` : ""}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {[item.color, item.shoe_type]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.customer_note && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Catatan: {item.customer_note}
                      </p>
                    )}
                    <div className="mt-3">
                      {item.services.map((service) => (
                        <div
                          key={service.service_id}
                          className="flex items-center justify-between py-1 text-sm"
                        >
                          <span className="text-gray-600 dark:text-gray-300">
                            {service.service_name}
                          </span>
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {formatIDR(service.unit_price)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm font-semibold dark:border-gray-800">
                        <span>Subtotal</span>
                        <span>{formatIDR(item.item_subtotal)}</span>
                      </div>
                    </div>
                    {item.photos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.photos.map((photo) => (
                          <a
                            key={photo.id}
                            href={photo.url}
                            target="_blank"
                            rel="noreferrer"
                            title={`Foto ${photo.type}`}
                          >
                            <img
                              src={photo.thumbnail_url ?? photo.url}
                              alt={`Foto ${photo.type} ${item.brand}`}
                              loading="lazy"
                              className="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Ringkasan Biaya">
              <Definition label="Subtotal" value={formatIDR(order.subtotal)} />
              <Definition
                label="Diskon"
                value={`− ${formatIDR(order.discount_value)}`}
              />
              <Definition
                label="Grand total"
                value={formatIDR(order.grand_total)}
              />
              <Definition
                label="Sudah dibayar"
                value={formatIDR(order.paid_total)}
              />
              <Definition
                label="Sisa"
                value={formatIDR(order.remaining_balance)}
              />
            </Section>

            <Section title="Pembayaran">
              {order.payments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belum ada pembayaran.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        <th className="px-2 py-2 font-medium">Tanggal</th>
                        <th className="px-2 py-2 font-medium">Metode</th>
                        <th className="px-2 py-2 font-medium">Nominal</th>
                        <th className="px-2 py-2 font-medium">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                        >
                          <td className="px-2 py-2">
                            {formatDateID(payment.created_at.slice(0, 10))}
                          </td>
                          <td className="px-2 py-2">
                            {payment.type === "refund"
                              ? `Refund ${payment.method}`
                              : payment.method}
                          </td>
                          <td className="px-2 py-2">
                            {formatIDR(payment.amount)}
                          </td>
                          <td className="px-2 py-2 text-gray-500 dark:text-gray-400">
                            {payment.note ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Riwayat Status">
              {order.status_histories.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Belum ada riwayat.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {order.status_histories.map((history, index) => (
                    <li
                      key={`${history.to_status}-${index}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:gap-2"
                    >
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {history.from_status
                          ? `${ORDER_STATUS_LABELS[history.from_status as OrderStatus] ?? history.from_status} → `
                          : ""}
                        {ORDER_STATUS_LABELS[history.to_status as OrderStatus] ??
                          history.to_status}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatDateID(history.created_at.slice(0, 10))}
                        {history.note ? ` · ${history.note}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {order.notes && (
              <Section title="Catatan Order">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {order.notes}
                </p>
              </Section>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Jumlah item: {formatNumberID(order.items_count)} pasang.
            </p>
          </div>
        )}
      </QueryState>
    </>
  );
}
