import { useCallback, useEffect, useMemo, useState } from "react";

import type { HeaderUserVM, TabKey } from "@/types";
import type { AuthSessionVM } from "@/lib/auth/auth.types";
import AppHeader from "@/components/app/AppHeader";
import AppTabs from "@/components/app/AppTabs";
import { GenerateTab } from "@/components/generate/GenerateTab";
import { RecipesTab } from "@/components/recipes/RecipesTab";
import { useActiveTab } from "@/components/hooks/useActiveTab";
import { useAuthStorage } from "@/components/hooks/useAuthStorage";
import { useLogout } from "@/components/hooks/useLogout";
import { redirectToAuth } from "@/lib/api/client";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

interface AppShellProps {
  defaultTab?: TabKey;
  authRedirectPath?: string;
}

function buildEmailShort(email: string): string {
  const [name, domain] = email.split("@");

  if (!domain) {
    return email;
  }

  return `${name}@…`;
}

export default function AppShell({ defaultTab = "generate", authRedirectPath = "/auth" }: AppShellProps) {
  const authStorage = useAuthStorage();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("unknown");
  const [session, setSession] = useState<AuthSessionVM | null>(null);
  const { activeTab, setActiveTab } = useActiveTab(defaultTab);

  useEffect(() => {
    const storedSession = authStorage.get();

    if (!storedSession?.access_token) {
      setAuthStatus("unauthenticated");
      redirectToAuth(authRedirectPath);
      return;
    }

    setSession(storedSession);
    setAuthStatus("authenticated");
  }, [authRedirectPath, authStorage]);

  const handleUnauthorized = useCallback(() => {
    authStorage.clear();
    setAuthStatus("unauthenticated");
    redirectToAuth(authRedirectPath);
  }, [authRedirectPath, authStorage]);

  const { logout, logoutState, errorMessage } = useLogout({
    accessToken: session?.access_token ?? null,
    onUnauthorized: handleUnauthorized,
    onSuccess: handleUnauthorized,
  });

  const headerUser = useMemo<HeaderUserVM | null>(() => {
    if (!session?.user?.email) {
      return null;
    }

    return {
      email: session.user.email,
      emailShort: buildEmailShort(session.user.email),
    };
  }, [session]);

  const handleNavigateToGenerate = useCallback(() => {
    setActiveTab("generate");
  }, [setActiveTab]);

  if (authStatus === "unknown") {
    return (
      <div className="rounded-md border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  if (authStatus === "unauthenticated" || !headerUser) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <AppHeader user={headerUser} logoutState={logoutState} onLogout={logout} />
      {errorMessage ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}
      <AppTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        generateContent={<GenerateTab onUnauthorized={handleUnauthorized} />}
        recipesContent={
          <RecipesTab onNavigateToGenerate={handleNavigateToGenerate} onUnauthorized={handleUnauthorized} />
        }
      />
    </section>
  );
}
