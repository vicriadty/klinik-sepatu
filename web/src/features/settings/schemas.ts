import { z } from "zod";

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT)" },
] as const;

export const settingsSchema = z.object({
  store_name: z.string().min(1, "Nama toko wajib diisi.").max(255),
  store_phone: z.string().max(50).nullable().optional().or(z.literal("")),
  store_address: z.string().max(500).nullable().optional().or(z.literal("")),
  receipt_footer: z.string().max(500).nullable().optional().or(z.literal("")),
  timezone: z.string().min(1, "Timezone wajib dipilih."),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
