import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageMeta from "../../components/common/PageMeta";
import ActionAlert from "../../components/common/ActionAlert";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import QueryState from "../dashboard/components/QueryState";
import { toApiError } from "../../services/api";
import type { NotificationHealth } from "../../services/settingsApi";
import {
  settingsSchema,
  TIMEZONE_OPTIONS,
  type SettingsFormValues,
} from "./schemas";
import { useSettings, useUpdateSettings } from "./useSettings";

export default function SettingsPage() {
  const settingsQuery = useSettings();
  const updateMutation = useUpdateSettings();
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <>
      <PageMeta
        title="Pengaturan | Klinik Sepatu"
        description="Profil toko dan konfigurasi notifikasi."
      />
      <div className="flex max-w-2xl flex-col gap-4 md:gap-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Pengaturan
        </h2>
        <QueryState
          isLoading={settingsQuery.isLoading}
          isError={settingsQuery.isError}
          isEmpty={settingsQuery.data === undefined}
          emptyText="Pengaturan tidak tersedia."
          onRetry={() => settingsQuery.refetch()}
        >
          {settingsQuery.data && (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                  Profil Toko
                </h3>
                <SettingsForm
                  key={settingsQuery.dataUpdatedAt}
                  initial={settingsQuery.data.settings}
                  pending={updateMutation.isPending}
                  submitError={submitError}
                  onDismissError={() => setSubmitError(null)}
                  onSubmit={(values) => {
                    setSaved(false);
                    setSubmitError(null);
                    updateMutation.mutate(values, {
                      onSuccess: () => setSaved(true),
                      onError: (error: unknown) => {
                        setSubmitError(
                          toApiError(error, "Gagal menyimpan pengaturan.")
                            .message
                        );
                      },
                    });
                  }}
                />
                {saved && (
                  <ActionAlert
                    variant="success"
                    title="Berhasil"
                    message="Pengaturan tersimpan."
                    onClose={() => setSaved(false)}
                  />
                )}
              </div>
              <NotificationCard health={settingsQuery.data.notifications} />
            </>
          )}
        </QueryState>
      </div>
    </>
  );
}

function SettingsForm({
  initial,
  pending,
  submitError,
  onDismissError,
  onSubmit,
}: {
  initial: SettingsFormValues;
  pending: boolean;
  submitError: string | null;
  onDismissError: () => void;
  onSubmit: (values: SettingsFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      store_name: initial.store_name,
      store_phone: initial.store_phone ?? "",
      store_address: initial.store_address ?? "",
      receipt_footer: initial.receipt_footer ?? "",
      timezone: initial.timezone,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-5">
        <div>
          <Label htmlFor="settings-name">
            Nama toko <span className="text-error-500">*</span>
          </Label>
          <Input
            id="settings-name"
            placeholder="cth: Klinik Sepatu Tebet"
            error={!!errors.store_name}
            hint={errors.store_name?.message}
            disabled={pending}
            {...register("store_name")}
          />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="settings-phone">Telepon toko</Label>
            <Input
              id="settings-phone"
              placeholder="cth: 0812000111"
              error={!!errors.store_phone}
              hint={errors.store_phone?.message}
              disabled={pending}
              {...register("store_phone")}
            />
          </div>
          <div>
            <Label htmlFor="settings-timezone">
              Timezone <span className="text-error-500">*</span>
            </Label>
            <select
              id="settings-timezone"
              disabled={pending}
              {...register("timezone")}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:[color-scheme:dark]"
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1.5 text-xs text-error-500">
                {errors.timezone.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="settings-address">Alamat</Label>
          <Input
            id="settings-address"
            placeholder="cth: Jl. Merdeka No. 10"
            error={!!errors.store_address}
            hint={errors.store_address?.message}
            disabled={pending}
            {...register("store_address")}
          />
        </div>
        <div>
          <Label htmlFor="settings-footer">Footer struk</Label>
          <Input
            id="settings-footer"
            placeholder="cth: Terima kasih atas kunjungan Anda"
            error={!!errors.receipt_footer}
            hint={
              errors.receipt_footer?.message ??
              "Tampil di struk digital WhatsApp."
            }
            disabled={pending}
            {...register("receipt_footer")}
          />
        </div>
        {submitError && (
          <ActionAlert
            variant="error"
            title="Gagal"
            message={submitError}
            onClose={onDismissError}
          />
        )}
        <div>
          <Button className="w-full sm:w-auto" size="sm" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function NotificationCard({ health }: { health: NotificationHealth }) {
  const whatsapp = health.whatsapp;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
        Notifikasi WhatsApp
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            whatsapp.enabled
              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
          }`}
        >
          {whatsapp.enabled ? "Aktif" : "Mati"}
        </span>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            whatsapp.configured
              ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400"
              : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
          }`}
        >
          {whatsapp.configured ? "Terkonfigurasi" : "Belum dikonfigurasi"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Terkirim 24 jam
          </p>
          <p className="mt-1 font-bold text-gray-800 dark:text-white/90">
            {whatsapp.last_24h.sent}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gagal 24 jam
          </p>
          <p className="mt-1 font-bold text-gray-800 dark:text-white/90">
            {whatsapp.last_24h.failed}
          </p>
        </div>
      </div>
      {!whatsapp.enabled && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Aktifkan lewat environment server setelah template Meta disetujui.
        </p>
      )}
    </div>
  );
}
