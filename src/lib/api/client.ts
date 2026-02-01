import type { ApiErrorDTO } from "@/types";

import { clearSession, getAccessToken } from "@/lib/auth/auth.storage";

const DEFAULT_AUTH_REDIRECT = "/auth";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.location !== "undefined";
}

export function redirectToAuth(path: string = DEFAULT_AUTH_REDIRECT): void {
  if (!isBrowser()) {
    return;
  }

  window.location.assign(path);
}

export class ApiUnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "ApiUnauthorizedError";
  }
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiFetchOptions extends RequestInit {
  redirectOnUnauthorized?: boolean;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: ApiFetchOptions = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearSession();

    if (init.redirectOnUnauthorized !== false) {
      redirectToAuth();
    }

    throw new ApiUnauthorizedError();
  }

  if (!response.ok) {
    let payload: ApiErrorDTO | null = null;

    try {
      payload = (await response.clone().json()) as ApiErrorDTO;
    } catch {
      payload = null;
    }

    const code = payload?.error?.code ?? "UNKNOWN_ERROR";
    const message = payload?.error?.message ?? "Request failed";
    const details = payload?.error?.details;

    throw new ApiRequestError(response.status, code, message, details);
  }

  return response;
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}
