import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import ActionAlert from "../common/ActionAlert";
import {
  loginSchema,
  type LoginFormValues,
} from "../../features/auth/validation";
import { useAuth } from "../../features/auth/AuthContext";
import { toApiError } from "../../services/api";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      login(values.username, values.password),
    onSuccess: () => navigate(from, { replace: true }),
    onError: (error: unknown) => {
      const apiError = toApiError(error, "Tidak dapat terhubung ke server.");
      if (apiError.status === 401) {
        setFormError("Username atau password salah.");
      } else if (apiError.status === 422) {
        setFormError("Periksa kembali isian form.");
      } else {
        setFormError(apiError.message);
      }
    },
  });

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Masuk
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masuk ke dashboard Klinik Sepatu.
            </p>
          </div>
          <div>
            <form
              onSubmit={handleSubmit((values) => {
                setFormError(null);
                mutation.mutate(values);
              })}
            >
              <div className="space-y-6">
                <div>
                  <Label htmlFor="username">
                    Username <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    id="username"
                    placeholder="cth: kasir1"
                    autoComplete="username"
                    error={!!errors.username}
                    hint={errors.username?.message}
                    disabled={mutation.isPending}
                    {...register("username")}
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      error={!!errors.password}
                      hint={errors.password?.message}
                      disabled={mutation.isPending}
                      {...register("password")}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {formError && (
                  <ActionAlert
                    variant="error"
                    title="Gagal masuk"
                    message={formError}
                    onClose={() => setFormError(null)}
                  />
                )}
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Memproses…" : "Masuk"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
