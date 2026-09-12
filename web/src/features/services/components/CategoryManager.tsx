import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { toApiError } from "../../../services/api";
import {
  categorySchema,
  type CategoryFormValues,
} from "../schemas";
import { useCreateCategory, useDeleteCategory, useServiceCategories } from "../useServices";
import QueryState from "../../dashboard/components/QueryState";

export default function CategoryManager() {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
    setActionError(null);
    createMutation.mutate(values, {
      onSuccess: () => reset(),
      onError: (error: unknown) => {
        const apiError = toApiError(error, "Gagal menambah kategori.");
        setActionError(apiError.message);
      },
    });
  };

  const remove = (id: number) => {
    setActionError(null);
    deleteMutation.mutate(id, {
      onSuccess: () => setConfirmId(null),
      onError: (error: unknown) => {
        const apiError = toApiError(error, "Gagal menghapus kategori.");
        setActionError(apiError.message);
        setConfirmId(null);
      },
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
        Kategori Layanan
      </h3>
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
              {confirmId === category.id ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Yakin?</span>
                  <button
                    type="button"
                    onClick={() => remove(category.id)}
                    className="text-xs font-medium text-error-500 hover:text-error-600"
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Batal
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setConfirmId(category.id);
                  }}
                  className="text-xs font-medium text-error-500 hover:text-error-600"
                >
                  Hapus
                </button>
              )}
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
      {actionError && (
        <p role="alert" className="mt-2 text-sm text-error-500">
          {actionError}
        </p>
      )}
    </div>
  );
}
