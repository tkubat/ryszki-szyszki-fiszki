import type { AuthResponseDTO, AuthSessionDTO, AuthUserDTO } from "@/types";

import type { UnauthReason } from "./session.types";

export interface StoredSessionVM {
  user: AuthUserDTO;
  session: AuthSessionDTO;
}

const STORAGE_KEY = "auth.session";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseStoredSession(raw: string | null): StoredSessionVM | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSessionVM;
    if (
      !parsed?.session?.access_token ||
      !parsed?.session?.refresh_token ||
      !parsed?.user?.id ||
      !parsed?.user?.email
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadStoredSession(): { value: StoredSessionVM | null; reason?: UnauthReason } {
  if (!isBrowser()) {
    return { value: null, reason: "no_tokens" };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { value: null, reason: "no_tokens" };
  }

  const parsed = parseStoredSession(raw);
  if (!parsed) {
    return { value: null, reason: "invalid_tokens" };
  }

  return { value: parsed };
}

export function getStoredSession(): StoredSessionVM | null {
  if (!isBrowser()) {
    return null;
  }

  return parseStoredSession(window.localStorage.getItem(STORAGE_KEY));
}

export function getStoredAccessToken(): string | null {
  return getStoredSession()?.session.access_token ?? null;
}

export function hasStoredSession(): boolean {
  return Boolean(getStoredAccessToken());
}

export function setStoredSession(dto: AuthResponseDTO): StoredSessionVM {
  const session: StoredSessionVM = {
    user: dto.user,
    session: dto.session,
  };

  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage write failures (e.g. privacy mode, quota).
    }
  }

  return session;
}

export function clearStoredSession(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage delete failures.
  }
}
