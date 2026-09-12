import { useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import QueryState from "../dashboard/components/QueryState";
import { formatDateID } from "../../utils/format";
import { toApiError } from "../../services/api";
import { ROLE_LABELS, type UserRole } from "../../services/authApi";
import {
  useDeleteUser,
  useSetUserActive,
  useUsers,
} from "./useUsers";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Semua role" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "cashier", label: "Kasir" },
];

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const listQuery = useUsers({
    page,
    per_page: 15,
    ...(search !== "" ? { search } : {}),
    ...(role !== "" ? { role } : {}),
  });
  const statusMutation = useSetUserActive();
  const deleteMutation = useDeleteUser();

  const rows = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const toggleActive = (id: number, next: boolean) => {
    setActionError(null);
    statusMutation.mutate(
      { id, is_active: next },
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
        setActionError(toApiError(error, "Gagal menghapus user.").message);
        setConfirmId(null);
      },
    });
  };

  return (
    <>
      <PageMeta
        title="Pengguna | Klinik Sepatu"
        description="Kelola akun Owner, Admin, dan Kasir."
      />
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Pengguna
          </h2>
          <Link
            to="/users/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Tambah User
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Cari</span>
              <div className="flex gap-2">
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applySearch();
                  }}
                  placeholder="Nama / username"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={applySearch}
                  className="rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700"
                >
                  Cari
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Role</span>
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:text-white/90"
              >
                {ROLE_OPTIONS.map((option) => (
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
            emptyText="Belum ada user."
            onRetry={() => listQuery.refetch()}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Login terakhir</th>
                    <th className="px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                        {user.name}
                      </td>
                      <td className="px-4 py-3">@{user.username}</td>
                      <td className="px-4 py-3">
                        {ROLE_LABELS[user.role as UserRole] ?? user.role}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
                          }`}
                        >
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {user.last_login_at
                          ? formatDateID(user.last_login_at.slice(0, 10))
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3">
                          <Link
                            to={`/users/${user.id}/edit`}
                            className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            Ubah
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleActive(user.id, !user.is_active)}
                            className="font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300"
                          >
                            {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          {confirmId === user.id ? (
                            <span className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">Yakin?</span>
                              <button
                                type="button"
                                onClick={() => remove(user.id)}
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
                                setConfirmId(user.id);
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
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">
                  Halaman {meta.page} dari {meta.last_page} ({meta.total}{" "}
                  user)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => setPage(meta.page - 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.last_page}
                    onClick={() => setPage(meta.page + 1)}
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
