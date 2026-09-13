import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { serviceSchema, type ServiceFormValues } from "./schemas";

export interface ServiceFormInitial {
  name: string;
  category_id?: number;
  description: string;
  price?: number;
  estimated_duration_days: number | null;
  active: boolean;
}

interface ServiceFormProps {
  initial: ServiceFormInitial;
  originalPrice?: number;
  categories: { id: number; name: string }[];
  pending: boolean;
  submitLabel: string;
  submitError: string | null;
  onSubmit: (values: ServiceFormValues) => void;
}

export default function ServiceForm({
  initial,
  originalPrice,
  categories,
  pending,
  submitLabel,
  submitError,
  onSubmit,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initial.name,
      category_id: initial.category_id,
      description: initial.description === "" ? null : initial.description,
      price: initial.price,
      estimated_duration_days: initial.estimated_duration_days,
      active: initial.active,
    },
  });

  const active = watch("active");
  const watchedPrice = watch("price");
  const priceChanged =
    originalPrice !== undefined && watchedPrice !== originalPrice;

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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
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
            {pending ? "Menyimpan…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

export const BLANK_SERVICE_FORM: ServiceFormInitial = {
  name: "",
  description: "",
  price: undefined,
  estimated_duration_days: null,
  active: true,
};
