import Constants from "expo-constants";

export interface ApiFieldErrors {
  [field: string]: string[];
}

export class ApiError extends Error {
  status?: number;
  fields: ApiFieldErrors;
  payload: unknown;

  constructor(
    message: string,
    status?: number,
    fields: ApiFieldErrors = {},
    payload: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.payload = payload;
  }
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/**
 * Dev builds derive the API host from the Metro dev server, so a DHCP IP
 * change does not break the app. `EXPO_PUBLIC_API_URL` is the explicit
 * override (required for production builds, and for tunnel mode).
 */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured;
  }

  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (metroHost) {
    return `http://${metroHost}:8000/api/v1`;
  }

  return "http://10.0.2.2:8000/api/v1";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  skipUnauthorizedHandler?: boolean;
  headers?: Record<string, string>;
  formData?: FormData;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    skipUnauthorizedHandler = false,
    headers: extraHeaders,
    formData,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };
  if (formData === undefined && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body:
        formData !== undefined
          ? formData
          : body === undefined
            ? undefined
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload = (payload ?? {}) as {
      message?: string;
      errors?: ApiFieldErrors;
    };
    if (response.status === 401 && !skipUnauthorizedHandler) {
      unauthorizedHandler?.();
    }
    throw new ApiError(
      errorPayload.message ?? "Terjadi kesalahan pada server.",
      response.status,
      errorPayload.errors ?? {},
      payload
    );
  }

  return payload as T;
}
