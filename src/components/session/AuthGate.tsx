import { useEffect, type ReactNode } from "react";

import type { AuthGateMode } from "@/lib/auth/session.types";
import { useSession } from "@/components/hooks/use-session";
import SessionBootScreen from "@/components/session/SessionBootScreen";

interface AuthGateProps {
  mode: AuthGateMode;
  children: ReactNode;
  bootFallback?: ReactNode;
  redirectToOnUnauth?: string;
  redirectToOnAuth?: string;
}

function redirectTo(path: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(path);
}

export default function AuthGate({
  mode,
  children,
  bootFallback,
  redirectToOnUnauth = "/auth",
  redirectToOnAuth = "/",
}: AuthGateProps) {
  const { state, actions } = useSession();

  const shouldRedirectToAuth = state.status === "unauthenticated" && mode === "require-auth";
  const shouldRedirectToApp = state.status === "authenticated" && mode === "require-unauth";

  useEffect(() => {
    if (shouldRedirectToAuth) {
      redirectTo(redirectToOnUnauth);
    }
    if (shouldRedirectToApp) {
      redirectTo(redirectToOnAuth);
    }
  }, [redirectToOnAuth, redirectToOnUnauth, shouldRedirectToApp, shouldRedirectToAuth]);

  if (state.status === "unknown") {
    return (
      bootFallback ?? (
        <SessionBootScreen
          error={state.bootError}
          onRetry={actions.boot}
          isRetrying={state.isBooting}
        />
      )
    );
  }

  if (state.status === "authenticated" && mode === "require-auth") {
    return <>{children}</>;
  }

  if (state.status === "unauthenticated" && mode === "require-unauth") {
    return <>{children}</>;
  }

  return null;
}
