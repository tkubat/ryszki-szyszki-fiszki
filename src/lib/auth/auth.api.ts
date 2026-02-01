import type { AuthResponseDTO, LoginCommand, SignupCommand } from "@/types";

import { getAccessToken } from "./auth.storage";
import type { ApiErrorResponse, AuthErrorVM } from "./auth.types";

const NETWORK_ERROR_MESSAGE = "Nie udało się połączyć z serwerem. Spróbuj ponownie.";
const GENERIC_ERROR_MESSAGE = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

export async function login(command: LoginCommand): Promise<AuthResponseDTO> {
  return requestAuth("/api/auth/login", command);
}

export async function signup(command: SignupCommand): Promise<AuthResponseDTO> {
  return requestAuth("/api/auth/signup", command);
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

async function requestAuth(endpoint: string, payload: LoginCommand | SignupCommand) {
  const response = await apiFetch(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await parseJson<ApiErrorResponse>(response);
    throw toAuthError(response.status, errorBody);
  }

  const data = await parseJson<AuthResponseDTO>(response);
  if (!data) {
    throw toAuthError(500, undefined);
  }

  return data;
}

async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(input, { ...init, headers });
  } catch {
    throw toAuthError(undefined, undefined, "network");
  }
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function toAuthError(status?: number, body?: ApiErrorResponse | null, overrideKind?: AuthErrorVM["kind"]): AuthErrorVM {
  if (overrideKind === "network") {
    return {
      kind: "network",
      message: NETWORK_ERROR_MESSAGE,
    };
  }

  if (status === 400) {
    return {
      kind: "validation",
      message: body?.error?.message ?? GENERIC_ERROR_MESSAGE,
      status,
      details: body?.error?.details,
    };
  }

  if (status === 401) {
    return {
      kind: "unauthorized",
      message: "Nieprawidłowy email lub hasło",
      status,
    };
  }

  if (status === 409) {
    return {
      kind: "conflict",
      message: "Konto z tym adresem email już istnieje",
      status,
    };
  }

  if (status && status >= 500) {
    return {
      kind: "server",
      message: GENERIC_ERROR_MESSAGE,
      status,
    };
  }

  return {
    kind: "unknown",
    message: GENERIC_ERROR_MESSAGE,
    status,
  };
}

export function normalizeAuthError(error: unknown): AuthErrorVM {
  if (error && typeof error === "object" && "kind" in error && "message" in error) {
    return error as AuthErrorVM;
  }

  return {
    kind: "unknown",
    message: GENERIC_ERROR_MESSAGE,
  };
}
