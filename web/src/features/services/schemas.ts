import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi.").max(255),
  description: z.string().max(1000).nullable().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

const priceField = z
  .number({ error: "Harga harus berupa angka." })
  .int("Harga harus bilangan bulat.")
  .min(0, "Harga tidak boleh negatif.");

export const serviceSchema = z.object({
  name: z.string().min(1, "Nama layanan wajib diisi.").max(255),
  category_id: z
    .number({ error: "Kategori wajib dipilih." })
    .int()
    .positive("Kategori wajib dipilih."),
  description: z.string().max(2000).nullable().optional(),
  price: priceField,
  estimated_duration_days: z
    .number({ error: "Durasi harus berupa angka." })
    .int()
    .min(0, "Durasi tidak boleh negatif.")
    .nullable()
    .optional(),
  active: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
