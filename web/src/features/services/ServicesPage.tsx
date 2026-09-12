import { useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import QueryState from "../dashboard/components/QueryState";
import { formatDateID, formatIDR, formatNumberID } from "../../utils/format";
import { toApiError } from "../../services/api";
import {
  useDeleteService,
  useServiceCategories,
  useServices,
  useSetServiceActive,
} from "./useServices";
import CategoryManager from "./components/CategoryManager";

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "1", label: "Aktif" },
  { value: "0", label: "Nonaktif" },
];

export default function ServicesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categoriesQuery = useServiceCategories();
  const listQuery = useServices({
    ...(search !== "" ? { search } : {}),
    ...(categoryId !== "" ? { category_id: Number(categoryId) } : {}),
    ...(active !== "" ? { active: active === "1" } : {}),
  });
  const statusMutation = useSetServiceActive();
  const deleteMutation = useDeleteService();

  const rows = listQuery.data ?? [];

  const toggleActive = (id: number, next: boolean) => {
    setActionError(null);
    statusMutation.mutate(
      { id, active: next },
      {
        onError: (error: unknown) => {
          setActionError(toApiError(error, "Gagal mengubah status.").message);
        },
      }
    );
  };

  const remove = (id: number) => {
    setActionError(null);
    deleteMutation.mutate(id, {
      onSuccess: () => setConfirmId(null),
      onError: (error: unknown) => {
        setActionError(toApiError(error, "Gagal menghapus layanan.").message);
        setConfirmId(null);
      },
    });
  };

  return (
    <>
      <PageMeta
        title="Layanan | Klinik Sepatu"
        description="Kelola layanan cleaning dan harga."
      />
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Layanan
          </h2>
          <Link
            to="/services/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Tambah Layanan
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Cari</span>
              <div className="flex gap-2">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setSearch(searchInput);
                  }}
                  placeholder="Nama layanan"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={() => setSearch(searchInput)}
                  className="rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700"
                >
                  Cari
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Kategori</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:text-white/90"
              >
                <option value="">Semua kategori</option>
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <select
                value={active}
                onChange={(event) => setActive(event.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:text-white/90"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {actionError && (
          <p role="alert" className="text-sm text-error-500">
            {actionError}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <QueryState
            isLoading={listQuery.isLoading}
            isError={listQuery.isError}
            isEmpty={rows.length === 0}
            emptyText="Belum ada layanan."
            onRetry={() => listQuery.refetch()}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Kategori</th>
                    <th className="px-4 py-3 font-medium">Harga</th>
                    <th className="px-4 py-3 font-medium">Durasi</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Diubah</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((service) => (
                    <tr
                      key={service.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                        {service.name}
                      </td>
                      <td className="px-4 py-3">{service.category.name}</td>
                      <td className="px-4 py-3">{formatIDR(service.price)}</td>
                      <td className="px-4 py-3">
                        {service.estimated_duration_days !== null
                          ? `${formatNumberID(service.estimated_duration_days)} hari`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                            service.active
                              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                          }`}
                        >
                          {service.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDateID(service.updated_at.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3">
                          <Link
                            to={`/services/${service.id}/edit`}
                            className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            Ubah
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(service.id, !service.active)
                            }
                            className="font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300"
                          >
                            {service.active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          {confirmId === service.id ? (
                            <span className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">Yakin?</span>
                              <button
                                type="button"
                                onClick={() => remove(service.id)}
                                className="font-medium text-error-500 hover:text-error-600"
                              >
                                Ya
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmId(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                Batal
                              </button>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setConfirmId(service.id);
                              }}
                              className="font-medium text-error-500 hover:text-error-600"
                            >
                              Hapus
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </QueryState>
        </div>

        <CategoryManager />
      </div>
    </>
  );
}
