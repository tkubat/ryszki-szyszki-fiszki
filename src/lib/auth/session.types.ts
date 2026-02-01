import type { AuthResponseDTO, AuthSessionDTO, AuthUserDTO } from "@/types";

export type SessionStatus = "unknown" | "authenticated" | "unauthenticated";

export type UnauthReason = "no_tokens" | "invalid_tokens" | "expired" | "unauthorized_401" | "boot_network_error";

export interface SessionBootError {
  message: string;
  kind: "network" | "unknown";
}

export interface SessionStateVM {
  status: SessionStatus;
  user: AuthUserDTO | null;
  session: AuthSessionDTO | null;
  bootError: SessionBootError | null;
  isBooting: boolean;
}

export interface SessionActionsVM {
  boot: () => Promise<void>;
  setSession: (auth: AuthResponseDTO) => void;
  clearSession: (reason?: UnauthReason) => void;
  logout: () => Promise<void>;
  handleUnauthorized: () => void;
}

export type AuthGateMode = "require-auth" | "require-unauth";
