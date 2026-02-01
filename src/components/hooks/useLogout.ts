import { useCallback, useState } from "react";

import type { LogoutState } from "@/types";
import { clearSession } from "@/lib/auth/auth.storage";
import { ApiRequestError, ApiUnauthorizedError, logout, redirectToAuth } from "@/lib/api/client";

interface UseLogoutOptions {
  accessToken: string | null;
  onUnauthorized: () => void;
  onSuccess: () => void;
}

interface UseLogoutResult {
  logout: () => Promise<void>;
  logoutState: LogoutState;
  errorMessage: string | null;
}

const LOGOUT_ERROR_MESSAGE = "Nie udało się wylogować. Spróbuj ponownie.";

export function useLogout({ accessToken, onUnauthorized, onSuccess }: UseLogoutOptions): UseLogoutResult {
  const [logoutState, setLogoutState] = useState<LogoutState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSuccess = useCallback(() => {
    setLogoutState("idle");
    setErrorMessage(null);
    onSuccess();
  }, [onSuccess]);

  const handleUnauthorized = useCallback(() => {
    setLogoutState("idle");
    setErrorMessage(null);
    onUnauthorized();
  }, [onUnauthorized]);

  const runLogout = useCallback(async () => {
    if (!accessToken) {
      clearSession();
      redirectToAuth();
      handleSuccess();
      return;
    }

    setLogoutState("loading");
    setErrorMessage(null);

    try {
      await logout();
      handleSuccess();
    } catch (error) {
      if (error instanceof ApiUnauthorizedError) {
        handleUnauthorized();
        return;
      }

      if (error instanceof ApiRequestError) {
        setLogoutState("error");
        setErrorMessage(LOGOUT_ERROR_MESSAGE);
        return;
      }

      setLogoutState("error");
      setErrorMessage(LOGOUT_ERROR_MESSAGE);
    }
  }, [accessToken, handleSuccess, handleUnauthorized]);

  return { logout: runLogout, logoutState, errorMessage };
}
