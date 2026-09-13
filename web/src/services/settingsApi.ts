import { api } from "./api";

export interface StoreSettings {
  store_name: string;
  store_phone: string | null;
  store_address: string | null;
  receipt_footer: string | null;
  timezone: string;
}

export interface NotificationHealth {
  whatsapp: {
    enabled: boolean;
    configured: boolean;
    last_24h: {
      sent: number;
      failed: number;
    };
  };
}

export interface SettingsResponse {
  settings: StoreSettings;
  notifications: NotificationHealth;
}

export interface UpdateSettingsPayload {
  store_name?: string;
  store_phone?: string | null;
  store_address?: string | null;
  receipt_footer?: string | null;
  timezone?: string;
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const response = await api.get<{ data: SettingsResponse }>("/settings");
  return response.data.data;
}

export async function updateSettings(
  payload: UpdateSettingsPayload
): Promise<SettingsResponse> {
  const response = await api.put<{ data: SettingsResponse }>(
    "/settings",
    payload
  );
  return response.data.data;
}
