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
import { formatDateID, formatIDR, formatNumberID } from "../../utils/format";
import { toApiError } from "../../services/api";
import {
  useCreateService,
  useDeleteService,
  useService,
  useServiceCategories,
  useServices,
  useSetServiceActive,
  useUpdateService,
} from "./useServices";
import ServiceForm, { BLANK_SERVICE_FORM } from "./ServiceForm";
import type { ServiceFormValues } from "./schemas";
import CategoryManager from "./components/CategoryManager";

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "1", label: "Aktif" },
  { value: "0", label: "Nonaktif" },
];

interface Feedback {
  variant: "success" | "error";
  title: string;
  message: string;
}

type ServiceModal =
  | { mode: "create" }
  | { mode: "edit"; id: string; name: string };

export default function ServicesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [active, setActive] = useState("");
  const [modal, setModal] = useState<ServiceModal | null>(null);
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

  const categoriesQuery = useServiceCategories();
  const listQuery = useServices({
    ...(search !== "" ? { search } : {}),
    ...(categoryId !== "" ? { category_id: Number(categoryId) } : {}),
    ...(active !== "" ? { active: active === "1" } : {}),
  });
  const statusMutation = useSetServiceActive();
  const deleteMutation = useDeleteService();

  const rows = listQuery.data ?? [];

  const notifyError = (fallback: string) => (error: unknown) => {
    setFeedback({
      variant: "error",
      title: "Gagal",
      message: toApiError(error, fallback).message,
    });
  };

  const confirmToggle = () => {
    if (!toggleTarget) return;
    const { id, name, next } = toggleTarget;
    statusMutation.mutate(
      { id, active: next },
      {
        onSuccess: () => {
          setToggleTarget(null);
          setFeedback({
            variant: "success",
            title: "Berhasil",
            message: next
              ? `Layanan "${name}" diaktifkan.`
              : `Layanan "${name}" dinonaktifkan.`,
          });
        },
        onError: (error: unknown) => {
          setToggleTarget(null);
          notifyError("Gagal mengubah status.")(error);
        },
      }
    );
  };

  const remove = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setFeedback({
          variant: "success",
          title: "Berhasil",
          message: `Layanan "${name}" dihapus.`,
        });
      },
      onError: notifyError("Gagal menghapus layanan."),
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
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setModal({ mode: "create" });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            <PlusIcon className="size-5" />
            Tambah Layanan
          </button>
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
                  className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
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
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
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
                className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
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
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDateID(service.updated_at.slice(0, 10))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Ubah layanan"
                            aria-label={`Ubah ${service.name}`}
                            onClick={() => {
                              setFeedback(null);
                              setModal({
                                mode: "edit",
                                id: String(service.id),
                                name: service.name,
                              });
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-brand-500 hover:bg-brand-500/10 hover:text-brand-600 dark:text-brand-400"
                          >
                            <PencilIcon className="size-5" />
                          </button>
                          <button
                            type="button"
                            title={
                              service.active ? "Nonaktifkan" : "Aktifkan"
                            }
                            aria-label={`${
                              service.active ? "Nonaktifkan" : "Aktifkan"
                            } ${service.name}`}
                            onClick={() => {
                              setFeedback(null);
                              setToggleTarget({
                                id: service.id,
                                name: service.name,
                                next: !service.active,
                              });
                            }}
                            className={`inline-flex items-center justify-center rounded-lg p-2 ${
                              service.active
                                ? "text-warning-500 hover:bg-warning-500/10 hover:text-warning-600 dark:text-warning-400"
                                : "text-success-500 hover:bg-success-500/10 hover:text-success-600 dark:text-success-400"
                            }`}
                          >
                            {service.active ? (
                              <CloseLineIcon className="size-5" />
                            ) : (
                              <CheckLineIcon className="size-5" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Hapus layanan"
                            aria-label={`Hapus ${service.name}`}
                            onClick={() => {
                              setFeedback(null);
                              setDeleteTarget({
                                id: service.id,
                                name: service.name,
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
          </QueryState>
        </div>

        <CategoryManager />
      </div>

      <Modal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        className="mx-4 max-w-2xl p-6 sm:p-8"
      >
        {modal?.mode === "create" && (
          <>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Tambah Layanan
            </h3>
            <CreateServiceForm
              onDone={(name) => {
                setModal(null);
                setFeedback({
                  variant: "success",
                  title: "Berhasil",
                  message: `Layanan "${name}" ditambahkan.`,
                });
              }}
              onError={(message) =>
                setFeedback({ variant: "error", title: "Gagal", message })
              }
            />
          </>
        )}
        {modal?.mode === "edit" && (
          <>
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Ubah Layanan
            </h3>
            <EditServiceForm
              id={modal.id}
              onDone={(name) => {
                setModal(null);
                setFeedback({
                  variant: "success",
                  title: "Berhasil",
                  message: `Layanan "${name}" diubah.`,
                });
              }}
              onError={(message) =>
                setFeedback({ variant: "error", title: "Gagal", message })
              }
            />
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus layanan?"
        message={
          deleteTarget
            ? `Layanan "${deleteTarget.name}" akan dinonaktifkan dari daftar. Layanan ini tetap tersimpan pada order lama.`
            : ""
        }
        confirmLabel="Ya, hapus"
        danger
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          const { id, name } = deleteTarget;
          deleteMutation.mutate(id, {
            onSuccess: () => {
              setDeleteTarget(null);
              setFeedback({
                variant: "success",
                title: "Berhasil",
                message: `Layanan "${name}" dihapus.`,
              });
            },
            onError: notifyError("Gagal menghapus layanan."),
          });
        }}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
      />

      <ConfirmModal
        isOpen={toggleTarget !== null}
        title={
          toggleTarget?.next ? "Aktifkan layanan?" : "Nonaktifkan layanan?"
        }
        message={
          toggleTarget
            ? toggleTarget.next
              ? `Layanan "${toggleTarget.name}" akan tersedia kembali pada pilihan order baru.`
              : `Layanan "${toggleTarget.name}" tidak akan muncul pada pilihan order baru. Layanan ini tetap tersimpan pada order lama.`
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

function CreateServiceForm({
  onDone,
  onError,
}: {
  onDone: (name: string) => void;
  onError: (message: string) => void;
}) {
  const categoriesQuery = useServiceCategories();
  const createMutation = useCreateService();
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (categoriesQuery.isLoading || categoriesQuery.isError) {
    return (
      <QueryState
        isLoading={categoriesQuery.isLoading}
        isError={categoriesQuery.isError}
        isEmpty={false}
        emptyText=""
        onRetry={() => categoriesQuery.refetch()}
      >
        <div />
      </QueryState>
    );
  }

  return (
    <ServiceForm
      initial={BLANK_SERVICE_FORM}
      categories={(categoriesQuery.data ?? []).map((category) => ({
        id: category.id,
        name: category.name,
      }))}
      pending={createMutation.isPending}
      submitLabel="Tambah"
      submitError={submitError}
      onSubmit={(values: ServiceFormValues) => {
        setSubmitError(null);
        createMutation.mutate(values, {
          onSuccess: (service) => onDone(service.name),
          onError: (error: unknown) => {
            const message = toApiError(error, "Gagal menambah layanan.").message;
            setSubmitError(message);
            onError(message);
          },
        });
      }}
    />
  );
}

function EditServiceForm({
  id,
  onDone,
  onError,
}: {
  id: string;
  onDone: (name: string) => void;
  onError: (message: string) => void;
}) {
  const categoriesQuery = useServiceCategories();
  const serviceQuery = useService(id);
  const updateMutation = useUpdateService(id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loading = categoriesQuery.isLoading || serviceQuery.isLoading;
  const failed = categoriesQuery.isError || serviceQuery.isError;

  if (loading || failed || !serviceQuery.data) {
    return (
      <QueryState
        isLoading={loading}
        isError={failed}
        isEmpty={false}
        emptyText=""
        onRetry={() => {
          categoriesQuery.refetch();
          serviceQuery.refetch();
        }}
      >
        <div />
      </QueryState>
    );
  }

  const service = serviceQuery.data;

  return (
    <ServiceForm
      key={service.updated_at}
      initial={{
        name: service.name,
        category_id: service.category_id,
        description: service.description ?? "",
        price: service.price,
        estimated_duration_days: service.estimated_duration_days,
        active: service.active,
      }}
      originalPrice={service.price}
      categories={(categoriesQuery.data ?? []).map((category) => ({
        id: category.id,
        name: category.name,
      }))}
      pending={updateMutation.isPending}
      submitLabel="Simpan Perubahan"
      submitError={submitError}
      onSubmit={(values: ServiceFormValues) => {
        setSubmitError(null);
        updateMutation.mutate(values, {
          onSuccess: (updated) => onDone(updated.name),
          onError: (error: unknown) => {
            const message = toApiError(error, "Gagal mengubah layanan.").message;
            setSubmitError(message);
            onError(message);
          },
        });
      }}
    />
  );
}
