import { useCallback } from "react";

import type { AuthResponseDTO } from "@/types";
import type { AuthSessionVM } from "@/lib/auth/auth.types";
import { clearSession, getSession, setSession } from "@/lib/auth/auth.storage";

interface AuthStorageHook {
  get: () => AuthSessionVM | null;
  set: (dto: AuthResponseDTO) => AuthSessionVM;
  clear: () => void;
}

export function useAuthStorage(): AuthStorageHook {
  const get = useCallback(() => getSession(), []);
  const set = useCallback((dto: AuthResponseDTO) => setSession(dto), []);
  const clear = useCallback(() => clearSession(), []);

  return { get, set, clear };
}
