import { useCallback, useState } from "react";

import type { AuthResponseDTO } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import type { AuthErrorVM } from "@/lib/auth/auth.types";
import { useSession } from "@/components/hooks/use-session";

export default function AuthView() {
  const [globalError, setGlobalError] = useState<AuthErrorVM | null>(null);
  const { actions } = useSession();

  const handleAuthSuccess = useCallback(
    (dto: AuthResponseDTO) => {
      setGlobalError(null);
      actions.setSession(dto);
    },
    [actions]
  );

  const handleAuthError = useCallback((error: AuthErrorVM) => {
    if (error.kind === "network" || error.kind === "server" || error.kind === "unknown") {
      setGlobalError(error);
      return;
    }

    setGlobalError(null);
  }, []);

  return (
    <Card className="w-full max-w-md shadow-sm" data-testid="auth-view">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Ryszki Szyszki Fiszki</CardTitle>
        <CardDescription>Zaloguj się, aby zapisywać i polubić przepisy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthErrorAlert error={globalError} onDismiss={() => setGlobalError(null)} />
        <AuthTabs onAuthSuccess={handleAuthSuccess} onAuthError={handleAuthError} />
      </CardContent>
    </Card>
  );
}
