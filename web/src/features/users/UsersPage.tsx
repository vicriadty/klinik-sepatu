import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ActionAlert from "../../components/common/ActionAlert";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Modal } from "../../components/ui/modal";
import {
  CheckLineIcon,
  CloseLineIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon,
} from "../../icons";
import QueryState from "../dashboard/components/QueryState";
import { formatDateID } from "../../utils/format";
import { toApiError } from "../../services/api";
import { ROLE_LABELS } from "../../services/authApi";
import { useAuth } from "../auth/AuthContext";
import { availableRoles } from "./schemas";
import UserForm from "./UserForm";
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
} from "./schemas";
import {
  useCreateUser,
  useDeleteUser,
  useSetUserActive,
  useUpdateUser,
  useUser,
  useUsers,
} from "./useUsers";
import type { ApiUserSummary } from "../../services/userApi";

const ROLE_OPTIONS = [
  { value: "", label: "Semua role" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "cashier", label: "Kasir" },
];

interface Feedback {
  variant: "success" | "error";
  title: string;
  message: string;
}

type UserModal = { mode: "create" } | { mode: "edit"; id: string };

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<UserModal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [toggleTarget, setToggleTarget] = useState<{
    id: number;
    name: string;
    next: boolean;
  } | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { user: currentUser } = useAuth();

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

  const showError = (fallback: string) => (error: unknown) => {
    setFeedback({
      variant: "error",
      title: "Gagal",
      message: toApiError(error, fallback).message,
    });
  };

  const showSuccess = (message: string) => {
    setModal(null);
    setDeleteTarget(null);
    setFeedback({ variant: "success", title: "Berhasil", message });
  };

  const confirmToggle = () => {
    if (!toggleTarget) return;
    const { id, name, next } = toggleTarget;
    statusMutation.mutate(
      { id, is_active: next },
      {
        onSuccess: () => {
          setToggleTarget(null);
          setFeedback({
            variant: "success",
            title: "Berhasil",
            message: next
              ? `User "${name}" diaktifkan.`
              : `User "${name}" dinonaktifkan.`,
          });
        },
        onError: (error: unknown) => {
          setToggleTarget(null);
          showError("Gagal mengubah status.")(error);
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    deleteMutation.mutate(id, {
      onSuccess: () => showSuccess(`User "${name}" dihapus.`),
      onError: showError("Gagal menghapus user."),
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
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setModal({ mode: "create" });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            <PlusIcon className="size-5" />
            Tambah User
          </button>
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
                  className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
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

        {feedback && (
          <ActionAlert
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
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
                        {ROLE_LABELS[user.role] ?? user.role}
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
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {user.last_login_at
                          ? formatDateID(user.last_login_at.slice(0, 10))
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Ubah user"
                            aria-label={`Ubah ${user.username}`}
                            onClick={() => {
                              setFeedback(null);
                              setModal({ mode: "edit", id: String(user.id) });
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-brand-500 hover:bg-brand-500/10 hover:text-brand-600 dark:text-brand-400"
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          <button
                            type="button"
                            title={
                              user.is_active ? "Nonaktifkan" : "Aktifkan"
                            }
                            aria-label={`${
                              user.is_active ? "Nonaktifkan" : "Aktifkan"
                            } ${user.username}`}
                            onClick={() => {
                              setFeedback(null);
                              setToggleTarget({
                                id: user.id,
                                name: user.name,
                                next: !user.is_active,
                              });
                            }}
                            className={`inline-flex items-center justify-center rounded-lg p-2 ${
                              user.is_active
                                ? "text-warning-500 hover:bg-warning-500/10 hover:text-warning-600 dark:text-warning-400"
                                : "text-success-500 hover:bg-success-500/10 hover:text-success-600 dark:text-success-400"
                            }`}
                          >
                            {user.is_active ? (
                              <CloseLineIcon className="size-5" />
                            ) : (
                              <CheckLineIcon className="size-5" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Hapus user"
                            aria-label={`Hapus ${user.username}`}
                            onClick={() => {
                              setFeedback(null);
                              setDeleteTarget({
                                id: user.id,
                                name: user.name,
                              });
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-error-500 hover:bg-error-500/10 hover:text-error-600"
                          >
                            <TrashBinIcon className="size-5" />
                          </button>
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

      <Modal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        className="mx-4 max-w-2xl p-6 sm:p-8"
      >
        {modal?.mode === "create" && (
          <>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Tambah User
            </h3>
            <CreateUserForm
              roles={availableRoles(currentUser?.role)}
              onDone={(name) => showSuccess(`User "${name}" ditambahkan.`)}
              onError={(message) =>
                setFeedback({ variant: "error", title: "Gagal", message })
              }
            />
          </>
        )}
        {modal?.mode === "edit" && (
          <>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Ubah User
            </h3>
            <EditUserForm
              id={modal.id}
              roles={availableRoles(currentUser?.role)}
              onDone={(name) => showSuccess(`User "${name}" diubah.`)}
              onError={(message) =>
                setFeedback({ variant: "error", title: "Gagal", message })
              }
            />
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus user?"
        message={
          deleteTarget
            ? `Akun "${deleteTarget.name}" akan dihapus dan tidak bisa masuk lagi. Aksi ini tidak dapat dibatalkan.`
            : ""
        }
        confirmLabel="Ya, hapus"
        danger
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          const { id, name } = deleteTarget;
          deleteMutation.mutate(id, {
            onSuccess: () => showSuccess(`User "${name}" dihapus.`),
            onError: showError("Gagal menghapus user."),
          });
        }}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
      />

      <ConfirmModal
        isOpen={toggleTarget !== null}
        title={toggleTarget?.next ? "Aktifkan user?" : "Nonaktifkan user?"}
        message={
          toggleTarget
            ? toggleTarget.next
              ? `Akun "${toggleTarget.name}" akan dapat masuk kembali ke dashboard.`
              : `Akun "${toggleTarget.name}" tidak akan bisa masuk ke dashboard sampai diaktifkan kembali.`
            : ""
        }
        confirmLabel={toggleTarget?.next ? "Ya, aktifkan" : "Ya, nonaktifkan"}
        pending={statusMutation.isPending}
        onConfirm={confirmToggle}
        onClose={() => {
          if (!statusMutation.isPending) setToggleTarget(null);
        }}
      />
    </>
  );
}

function CreateUserForm({
  roles,
  onDone,
  onError,
}: {
  roles: ReturnType<typeof availableRoles>;
  onDone: (name: string) => void;
  onError: (message: string) => void;
}) {
  const createMutation = useCreateUser();
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <UserForm
      mode="create"
      initial={{ name: "", email: "", role: roles[0] ?? "cashier" }}
      roles={roles}
      pending={createMutation.isPending}
      submitLabel="Tambah"
      submitError={submitError}
      onSubmit={(values) => {
        const payload = values as CreateUserFormValues;
        setSubmitError(null);
        createMutation.mutate(payload, {
          onSuccess: (user) => onDone(user.name),
          onError: (error: unknown) => {
            const message = toApiError(error, "Gagal menambah user.").message;
            setSubmitError(message);
            onError(message);
          },
        });
      }}
    />
  );
}

function EditUserForm({
  id,
  roles,
  onDone,
  onError,
}: {
  id: string;
  roles: ReturnType<typeof availableRoles>;
  onDone: (name: string) => void;
  onError: (message: string) => void;
}) {
  const detailQuery = useUser(id);
  const updateMutation = useUpdateUser(id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (detailQuery.isLoading || detailQuery.isError || !detailQuery.data) {
    return (
      <QueryState
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        isEmpty={false}
        emptyText=""
        onRetry={() => detailQuery.refetch()}
      >
        <div />
      </QueryState>
    );
  }

  const user = detailQuery.data;

  return (
    <UserForm
      key={user.updated_at}
      mode="edit"
      initial={{
        name: user.name,
        email: user.email ?? "",
        role: roles.includes(user.role) ? user.role : roles[0] ?? "cashier",
      }}
      roles={roles}
      pending={updateMutation.isPending}
      submitLabel="Simpan Perubahan"
      submitError={submitError}
      onSubmit={(values) => {
        const payload = values as UpdateUserFormValues;
        setSubmitError(null);
        updateMutation.mutate(
          {
            ...payload,
            password: payload.password || undefined,
          },
          {
            onSuccess: (updated: ApiUserSummary) => onDone(updated.name),
            onError: (error: unknown) => {
              const message = toApiError(
                error,
                "Gagal mengubah user."
              ).message;
              setSubmitError(message);
              onError(message);
            },
          }
        );
      }}
    />
  );
}
