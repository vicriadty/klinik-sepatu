import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import QueryState from "../dashboard/components/QueryState";
import { toApiError } from "../../services/api";
import { serviceSchema, type ServiceFormValues } from "./schemas";
import {
  useCreateService,
  useService,
  useServiceCategories,
  useUpdateService,
} from "./useServices";
import { useState } from "react";

export default function ServiceFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined && id !== "";
  const navigate = useNavigate();
  const categoriesQuery = useServiceCategories();
  const serviceQuery = useService(isEdit ? id : undefined);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(id ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && (serviceQuery.isLoading || serviceQuery.isError)) {
    return (
      <QueryState
        isLoading={serviceQuery.isLoading}
        isError={serviceQuery.isError}
        isEmpty={false}
        emptyText=""
        onRetry={() => serviceQuery.refetch()}
      >
        <div />
      </QueryState>
    );
  }

  return (
    <>
      <PageMeta
        title={`${isEdit ? "Ubah" : "Tambah"} Layanan | Klinik Sepatu`}
        description="Form layanan cleaning."
      />
      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? "Ubah Layanan" : "Tambah Layanan"}
        </h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <ServiceForm
            key={serviceQuery.data?.updated_at ?? "new"}
            initialName={serviceQuery.data?.name ?? ""}
            initialCategoryId={serviceQuery.data?.category_id}
            initialDescription={serviceQuery.data?.description ?? ""}
            initialPrice={serviceQuery.data?.price}
            initialDuration={
              serviceQuery.data?.estimated_duration_days ?? null
            }
            initialActive={serviceQuery.data?.active ?? true}
            isEdit={isEdit}
            pending={pending}
            submitError={submitError}
            categories={
              (categoriesQuery.data ?? []).map((category) => ({
                id: category.id,
                name: category.name,
              }))
            }
            onSubmit={(values) => {
              setSubmitError(null);
              const mutate = isEdit
                ? updateMutation.mutateAsync(values)
                : createMutation.mutateAsync(values);
              mutate.then(
                () => navigate("/services"),
                (error: unknown) => {
                  setSubmitError(
                    toApiError(error, "Gagal menyimpan layanan.").message
                  );
                }
              );
            }}
          />
        </div>
      </div>
    </>
  );
}

function ServiceForm({
  initialName,
  initialCategoryId,
  initialDescription,
  initialPrice,
  initialDuration,
  initialActive,
  isEdit,
  pending,
  submitError,
  categories,
  onSubmit,
}: {
  initialName: string;
  initialCategoryId?: number;
  initialDescription: string;
  initialPrice?: number;
  initialDuration: number | null;
  initialActive: boolean;
  isEdit: boolean;
  pending: boolean;
  submitError: string | null;
  categories: { id: number; name: string }[];
  onSubmit: (values: ServiceFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialName,
      category_id: initialCategoryId,
      description: initialDescription === "" ? null : initialDescription,
      price: initialPrice,
      estimated_duration_days: initialDuration,
      active: initialActive,
    },
  });

  const active = watch("active");
  const watchedPrice = watch("price");
  const priceChanged =
    isEdit && initialPrice !== undefined && watchedPrice !== initialPrice;

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          description:
            values.description === "" || values.description === undefined
              ? null
              : values.description,
        })
      )}
    >
      <div className="space-y-5">
        <div>
          <Label htmlFor="service-name">
            Nama layanan <span className="text-error-500">*</span>
          </Label>
          <Input
            id="service-name"
            placeholder="cth: Deep Clean"
            error={!!errors.name}
            hint={errors.name?.message}
            disabled={pending}
            {...register("name")}
          />
        </div>
        <div>
          <Label htmlFor="service-category">
            Kategori <span className="text-error-500">*</span>
          </Label>
          <select
            id="service-category"
            disabled={pending}
            {...register("category_id", { valueAsNumber: true })}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
          >
            <option value="">Pilih kategori…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="mt-1.5 text-xs text-error-500">
              {errors.category_id.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="service-description">Deskripsi</Label>
          <Input
            id="service-description"
            placeholder="Keterangan singkat layanan"
            error={!!errors.description}
            hint={errors.description?.message}
            disabled={pending}
            {...register("description")}
          />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="service-price">
              Harga (Rp) <span className="text-error-500">*</span>
            </Label>
            <Input
              id="service-price"
              type="number"
              min={0}
              step={1}
              placeholder="cth: 35000"
              error={!!errors.price}
              hint={errors.price?.message}
              disabled={pending}
              {...register("price", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label htmlFor="service-duration">Estimasi durasi (hari)</Label>
            <Input
              id="service-duration"
              type="number"
              min={0}
              step={1}
              placeholder="cth: 3"
              error={!!errors.estimated_duration_days}
              hint={errors.estimated_duration_days?.message}
              disabled={pending}
              {...register("estimated_duration_days", {
                setValueAs: (value: unknown) =>
                  value === "" || value === undefined || value === null
                    ? null
                    : Number(value),
              })}
            />
          </div>
        </div>
        {priceChanged && (
          <p
            role="alert"
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400"
          >
            Harga baru hanya berlaku untuk order baru. Order lama tidak
            berubah.
          </p>
        )}
        <Checkbox
          label="Aktif (tampil di kasir)"
          checked={active}
          onChange={(checked) => setValue("active", checked)}
          disabled={pending}
        />
        {submitError && (
          <p role="alert" className="text-sm text-error-500">
            {submitError}
          </p>
        )}
        <div>
          <Button className="w-full sm:w-auto" size="sm" disabled={pending}>
            {pending ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah"}
          </Button>
        </div>
      </div>
    </form>
  );
}
