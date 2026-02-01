import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { AuthResponseDTO, RecipesListResponseDTO } from "@/types";
import { apiFetch, ApiRequestError, ApiUnauthorizedError } from "@/lib/api/client";
import { clearStoredSession, loadStoredSession, setStoredSession } from "@/lib/auth/session.storage";
import type { SessionActionsVM, SessionStateVM, UnauthReason } from "@/lib/auth/session.types";

const NETWORK_ERROR_MESSAGE = "Nie udało się połączyć z serwerem. Spróbuj ponownie.";
const GENERIC_ERROR_MESSAGE = "Nie udało się zweryfikować sesji. Spróbuj ponownie.";

interface SessionProviderProps {
  children: ReactNode;
  autoBoot?: boolean;
  onUnauthenticated?: (reason: UnauthReason) => void;
  onAuthenticated?: () => void;
  bootStrategy?: "validate-with-api" | "token-only";
}

interface SessionContextValue {
  state: SessionStateVM;
  actions: SessionActionsVM;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export default function SessionProvider({
  children,
  autoBoot = true,
  onUnauthenticated,
  onAuthenticated,
  bootStrategy = "validate-with-api",
}: SessionProviderProps) {
  const [state, setState] = useState<SessionStateVM>({
    status: "unknown",
    user: null,
    session: null,
    bootError: null,
    isBooting: false,
  });
  const isBootingRef = useRef(false);

  const clearSession = useCallback(
    (reason?: UnauthReason) => {
      clearStoredSession();
      setState({
        status: "unauthenticated",
        user: null,
        session: null,
        bootError: null,
        isBooting: false,
      });
      if (reason) {
        onUnauthenticated?.(reason);
      }
    },
    [onUnauthenticated]
  );

  const handleUnauthorized = useCallback(() => {
    clearSession("unauthorized_401");
  }, [clearSession]);

  const setSession = useCallback(
    (auth: AuthResponseDTO) => {
      const stored = setStoredSession(auth);
      setState({
        status: "authenticated",
        user: stored.user,
        session: stored.session,
        bootError: null,
        isBooting: false,
      });
      onAuthenticated?.();
    },
    [onAuthenticated]
  );

  const boot = useCallback(async () => {
    if (isBootingRef.current) {
      return;
    }

    isBootingRef.current = true;
    setState((prev) => ({
      ...prev,
      status: "unknown",
      bootError: null,
      isBooting: true,
    }));

    const stopBooting = () => {
      isBootingRef.current = false;
    };

    const { value: stored, reason } = loadStoredSession();
    if (!stored?.session?.access_token) {
      stopBooting();
      clearSession(reason ?? "no_tokens");
      return;
    }

    if (bootStrategy === "token-only") {
      stopBooting();
      setState({
        status: "authenticated",
        user: stored.user,
        session: stored.session,
        bootError: null,
        isBooting: false,
      });
      onAuthenticated?.();
      return;
    }

    try {
      const response = await apiFetch("/api/recipes?limit=1", {
        method: "GET",
        redirectOnUnauthorized: false,
      });

      if (!response.ok) {
        throw new ApiRequestError(500, "UNKNOWN_ERROR", "Request failed");
      }

      void ((await response.json()) as RecipesListResponseDTO);

      setState({
        status: "authenticated",
        user: stored.user,
        session: stored.session,
        bootError: null,
        isBooting: false,
      });
      onAuthenticated?.();
    } catch (error) {
      if (error instanceof ApiUnauthorizedError) {
        stopBooting();
        clearSession("unauthorized_401");
        return;
      }

      const isNetworkError = !(error instanceof ApiRequestError);
      setState((prev) => ({
        ...prev,
        status: "unknown",
        bootError: {
          message: isNetworkError ? NETWORK_ERROR_MESSAGE : GENERIC_ERROR_MESSAGE,
          kind: isNetworkError ? "network" : "unknown",
        },
        isBooting: false,
      }));
    } finally {
      stopBooting();
    }
  }, [bootStrategy, clearSession, onAuthenticated]);

  const logout = useCallback(async () => {
    if (!state.session?.access_token) {
      clearSession("no_tokens");
      return;
    }

    try {
      await apiFetch("/api/auth/logout", { method: "POST", redirectOnUnauthorized: false });
      clearSession();
    } catch (error) {
      if (error instanceof ApiUnauthorizedError) {
        clearSession("unauthorized_401");
        return;
      }

      console.error("Failed to logout", error);
      throw error;
    }
  }, [clearSession, state.session?.access_token]);

  const actions = useMemo<SessionActionsVM>(
    () => ({
      boot,
      setSession,
      clearSession,
      logout,
      handleUnauthorized,
    }),
    [boot, clearSession, handleUnauthorized, logout, setSession]
  );

  const value = useMemo(
    () => ({
      state,
      actions,
    }),
    [actions, state]
  );

  useEffect(() => {
    if (autoBoot) {
      void boot();
    }
  }, [autoBoot, boot]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
