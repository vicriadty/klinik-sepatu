import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import ActionAlert from "../../../components/common/ActionAlert";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { TrashBinIcon } from "../../../icons";
import { toApiError } from "../../../services/api";
import {
  categorySchema,
  type CategoryFormValues,
} from "../schemas";
import { useCreateCategory, useDeleteCategory, useServiceCategories } from "../useServices";
import QueryState from "../../dashboard/components/QueryState";

export default function CategoryManager() {
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const categoriesQuery = useServiceCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) });

  const submit = (values: CategoryFormValues) => {
    setFeedback(null);
    createMutation.mutate(values, {
      onSuccess: (category) => {
        reset();
        setFeedback({
          variant: "success",
          message: `Kategori "${category.name}" ditambahkan.`,
        });
      },
      onError: (error: unknown) => {
        setFeedback({
          variant: "error",
          message: toApiError(error, "Gagal menambah kategori.").message,
        });
      },
    });
  };

  const remove = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteTarget(null);
        setFeedback({
          variant: "success",
          message: `Kategori "${name}" dihapus.`,
        });
      },
      onError: (error: unknown) => {
        setDeleteTarget(null);
        setFeedback({
          variant: "error",
          message: toApiError(error, "Gagal menghapus kategori.").message,
        });
      },
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
        Kategori Layanan
      </h3>
      {feedback && (
        <div className="mb-4">
          <ActionAlert
            variant={feedback.variant}
            title={feedback.variant === "success" ? "Berhasil" : "Gagal"}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        </div>
      )}
      <QueryState
        isLoading={categoriesQuery.isLoading}
        isError={categoriesQuery.isError}
        isEmpty={(categoriesQuery.data?.length ?? 0) === 0}
        emptyText="Belum ada kategori."
        onRetry={() => categoriesQuery.refetch()}
      >
        <ul className="mb-4 flex flex-col gap-2">
          {(categoriesQuery.data ?? []).map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/5"
            >
              <span className="font-medium text-gray-800 dark:text-white/90">
                {category.name}
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  {category.services_count ?? 0} layanan
                </span>
              </span>
              <button
                type="button"
                title={`Hapus kategori ${category.name}`}
                aria-label={`Hapus kategori ${category.name}`}
                onClick={() => {
                  setFeedback(null);
                  setDeleteTarget({ id: category.id, name: category.name });
                }}
                className="inline-flex items-center justify-center rounded-lg p-2 text-error-500 hover:bg-error-500/10 hover:text-error-600"
              >
                <TrashBinIcon className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      </QueryState>
      <form
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-2 sm:flex-row sm:items-start"
      >
        <div className="flex-1">
          <Input
            placeholder="Nama kategori baru"
            aria-label="Nama kategori baru"
            error={!!errors.name}
            hint={errors.name?.message}
            disabled={createMutation.isPending}
            {...register("name")}
          />
        </div>
        <Button size="sm" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Menambah…" : "Tambah"}
        </Button>
      </form>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus kategori?"
        message={
          deleteTarget
            ? `Kategori "${deleteTarget.name}" akan dihapus permanen. Kategori yang masih memiliki layanan tidak dapat dihapus.`
            : ""
        }
        confirmLabel="Ya, hapus"
        danger
        pending={deleteMutation.isPending}
        onConfirm={remove}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
