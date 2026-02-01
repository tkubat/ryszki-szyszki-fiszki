import { useCallback } from "react";

import type { AuthResponseDTO, LoginCommand, SignupCommand } from "@/types";

import { login, logout, signup } from "./auth.api";
import { clearSession, getSession, setSession } from "./auth.storage";
import type { AuthSessionVM } from "./auth.types";

export function useAuth() {
  const getStoredSession = useCallback((): AuthSessionVM | null => getSession(), []);

  const persistSession = useCallback((dto: AuthResponseDTO): AuthSessionVM => {
    return setSession(dto);
  }, []);

  const clearStoredSession = useCallback((): void => {
    clearSession();
  }, []);

  const loginUser = useCallback(async (command: LoginCommand): Promise<AuthResponseDTO> => {
    return login(command);
  }, []);

  const signupUser = useCallback(async (command: SignupCommand): Promise<AuthResponseDTO> => {
    return signup(command);
  }, []);

  const logoutUser = useCallback(async (): Promise<void> => {
    await logout();
    clearSession();
  }, []);

  return {
    getSession: getStoredSession,
    setSession: persistSession,
    clearSession: clearStoredSession,
    login: loginUser,
    signup: signupUser,
    logout: logoutUser,
  };
}
