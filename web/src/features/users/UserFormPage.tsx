import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import QueryState from "../dashboard/components/QueryState";
import { toApiError } from "../../services/api";
import { ROLE_LABELS } from "../../services/authApi";
import { useAuth } from "../auth/AuthContext";
import {
  availableRoles,
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "./schemas";
import { useCreateUser, useUpdateUser, useUser } from "./useUsers";

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined && id !== "";
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const detailQuery = useUser(isEdit ? id : undefined);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(id ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pending = createMutation.isPending || updateMutation.isPending;
  const roles = availableRoles(currentUser?.role);

  if (isEdit && (detailQuery.isLoading || detailQuery.isError)) {
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

  return (
    <>
      <PageMeta
        title={`${isEdit ? "Ubah" : "Tambah"} User | Klinik Sepatu`}
        description="Form akun pengguna."
      />
      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? "Ubah User" : "Tambah User"}
        </h2>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          {isEdit ? (
            <EditForm
              key={detailQuery.data?.updated_at ?? "edit"}
              initialName={detailQuery.data?.name ?? ""}
              initialEmail={detailQuery.data?.email ?? ""}
              initialRole={detailQuery.data?.role ?? "cashier"}
              roles={roles}
              pending={pending}
              submitError={submitError}
              onSubmit={(values) => {
                setSubmitError(null);
                updateMutation
                  .mutateAsync({
                    ...values,
                    password: values.password || undefined,
                  })
                  .then(
                    () => navigate("/users"),
                    (error: unknown) => {
                      setSubmitError(
                        toApiError(error, "Gagal menyimpan user.").message
                      );
                    }
                  );
              }}
            />
          ) : (
            <CreateForm
              roles={roles}
              pending={pending}
              submitError={submitError}
              onSubmit={(values) => {
                setSubmitError(null);
                createMutation.mutateAsync(values).then(
                  () => navigate("/users"),
                  (error: unknown) => {
                    setSubmitError(
                      toApiError(error, "Gagal menyimpan user.").message
                    );
                  }
                );
              }}
            />
          )}
          {currentUser?.role !== "owner" && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Role Owner hanya dapat dikelola oleh Owner.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function CreateForm({
  roles,
  pending,
  submitError,
  onSubmit,
}: {
  roles: ReturnType<typeof availableRoles>;
  pending: boolean;
  submitError: string | null;
  onSubmit: (values: CreateUserFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: roles[0] ?? "cashier" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
        <div>
          <Label htmlFor="user-username">
            Username <span className="text-error-500">*</span>
          </Label>
          <Input
            id="user-username"
            placeholder="cth: budi_kasir"
            autoComplete="username"
            error={!!errors.username}
            hint={errors.username?.message}
            disabled={pending}
            {...register("username")}
          />
        </div>
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
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
            Password <span className="text-error-500">*</span>
          </Label>
          <Input
            id="user-password"
            type="password"
            placeholder="Minimal 8 karakter"
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
            {pending ? "Menyimpan…" : "Tambah"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function EditForm({
  initialName,
  initialEmail,
  initialRole,
  roles,
  pending,
  submitError,
  onSubmit,
}: {
  initialName: string;
  initialEmail: string;
  initialRole: CreateUserFormValues["role"];
  roles: ReturnType<typeof availableRoles>;
  pending: boolean;
  submitError: string | null;
  onSubmit: (values: UpdateUserFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail === "" ? null : initialEmail,
      role: roles.includes(initialRole) ? initialRole : roles[0],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white/90"
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
          <Label htmlFor="user-password">Password baru (opsional)</Label>
          <Input
            id="user-password"
            type="password"
            placeholder="Kosongkan bila tidak diubah"
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
            {pending ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </form>
  );
}
