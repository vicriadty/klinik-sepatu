import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { ROLE_LABELS, type UserRole } from "../../services/authApi";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "./schemas";

export interface UserFormInitial {
  name: string;
  email: string;
  role: UserRole;
}

interface UserFormProps {
  mode: "create" | "edit";
  initial: UserFormInitial;
  roles: UserRole[];
  pending: boolean;
  submitLabel: string;
  submitError: string | null;
  onSubmit: (values: CreateUserFormValues | UpdateUserFormValues) => void;
}

export default function UserForm({
  mode,
  initial,
  roles,
  pending,
  submitLabel,
  submitError,
  onSubmit,
}: UserFormProps) {
  const isCreate = mode === "create";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues | UpdateUserFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isCreate ? createUserSchema : updateUserSchema) as any,
    defaultValues: {
      ...(isCreate ? { username: "", password: "" } : { password: "" }),
      name: initial.name,
      email: initial.email === "" ? null : initial.email,
      role: roles.includes(initial.role) ? initial.role : roles[0],
    },
  });

  const usernameError =
    "username" in errors ? errors.username?.message : undefined;

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <div className="space-y-5">
        <div>
          <Label htmlFor="user-name">
            Nama <span className="text-error-500">*</span>
          </Label>
          <Input
            id="user-name"
            placeholder="cth: Budi Santoso"
            error={!!errors.name}
            hint={errors.name?.message}
            disabled={pending}
            {...register("name")}
          />
        </div>
        {isCreate && (
          <div>
            <Label htmlFor="user-username">
              Username <span className="text-error-500">*</span>
            </Label>
            <Input
              id="user-username"
              placeholder="cth: budi_kasir"
              autoComplete="username"
              error={!!usernameError}
              hint={usernameError}
              disabled={pending}
              {...register("username" as const)}
            />
          </div>
        )}
        <div>
          <Label htmlFor="user-email">Email (opsional)</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="cth: budi@tokoku.id"
            error={!!errors.email}
            hint={errors.email?.message}
            disabled={pending}
            {...register("email")}
          />
        </div>
        <div>
          <Label htmlFor="user-role">
            Role <span className="text-error-500">*</span>
          </Label>
          <select
            id="user-role"
            disabled={pending}
            {...register("role")}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1.5 text-xs text-error-500">
              {errors.role.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="user-password">
            Password{" "}
            {isCreate ? (
              <span className="text-error-500">*</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                (opsional)
              </span>
            )}
          </Label>
          <Input
            id="user-password"
            type="password"
            placeholder={
              isCreate ? "Minimal 8 karakter" : "Kosongkan bila tidak diubah"
            }
            autoComplete="new-password"
            error={!!errors.password}
            hint={errors.password?.message}
            disabled={pending}
            {...register("password")}
          />
        </div>
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
