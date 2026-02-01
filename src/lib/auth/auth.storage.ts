import type { AuthResponseDTO } from "@/types";

import type { AuthSessionVM } from "./auth.types";
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredSession,
  hasStoredSession,
  setStoredSession,
} from "./session.storage";

export function getSession(): AuthSessionVM | null {
  const stored = getStoredSession();
  if (!stored) {
    return null;
  }

  return {
    user: stored.user,
    access_token: stored.session.access_token,
    refresh_token: stored.session.refresh_token,
  };
}

export function getAccessToken(): string | null {
  return getStoredAccessToken();
}

export function hasSession(): boolean {
  return hasStoredSession();
}

export function setSession(dto: AuthResponseDTO): AuthSessionVM {
  const stored = setStoredSession(dto);
  return {
    user: stored.user,
    access_token: stored.session.access_token,
    refresh_token: stored.session.refresh_token,
  };
}

export function clearSession(): void {
  clearStoredSession();
}
