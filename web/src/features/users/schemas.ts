import { z } from "zod";
import type { UserRole } from "../../services/authApi";

export const USER_ROLES: UserRole[] = ["owner", "admin", "cashier"];

/**
 * Roles the current user may assign. Admins can never grant (or see)
 * the owner role; owners see everything.
 */
export function availableRoles(currentRole: UserRole | undefined): UserRole[] {
  if (currentRole === "owner") {
    return USER_ROLES;
  }
  return ["admin", "cashier"];
}

const passwordField = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(255)
  .nullable()
  .optional()
  .or(z.literal(""));

export const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi.").max(255),
  username: z
    .string()
    .min(1, "Username wajib diisi.")
    .min(3, "Username minimal 3 karakter.")
    .max(50)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh huruf, angka, dan underscore."
    ),
  email: z
    .string()
    .max(255)
    .email("Format email tidak valid.")
    .nullable()
    .optional()
    .or(z.literal("")),
  role: z.enum(["owner", "admin", "cashier"], {
    error: "Role wajib dipilih.",
  }),
  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .min(8, "Password minimal 8 karakter.")
    .max(255),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi.").max(255),
  email: z
    .string()
    .max(255)
    .email("Format email tidak valid.")
    .nullable()
    .optional()
    .or(z.literal("")),
  role: z.enum(["owner", "admin", "cashier"], {
    error: "Role wajib dipilih.",
  }),
  password: passwordField,
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
