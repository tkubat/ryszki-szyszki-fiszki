import { useCallback, useEffect, useState } from "react";

import type { AuthResponseDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuthErrorVM, AuthTab } from "@/lib/auth/auth.types";

import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

interface AuthTabsProps {
  activeTab?: AuthTab;
  onAuthSuccess: (dto: AuthResponseDTO) => void;
  onAuthError: (error: AuthErrorVM) => void;
}

export function AuthTabs({ activeTab, onAuthError, onAuthSuccess }: AuthTabsProps) {
  const [tab, setTab] = useState<AuthTab>(activeTab ?? "login");

  useEffect(() => {
    if (activeTab && activeTab !== tab) {
      setTab(activeTab);
    }
  }, [activeTab, tab]);

  const handleTabChange = useCallback((nextValue: string) => {
    if (nextValue === "login" || nextValue === "signup") {
      setTab(nextValue);
    }
  }, []);

  const switchTab = useCallback(() => {
    setTab((current) => (current === "login" ? "signup" : "login"));
  }, []);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2" data-testid="auth-tabs">
          <TabsTrigger value="login" data-testid="auth-tab-login">
            Logowanie
          </TabsTrigger>
          <TabsTrigger value="signup" data-testid="auth-tab-signup">
            Rejestracja
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm onSuccess={onAuthSuccess} onError={onAuthError} />
        </TabsContent>
        <TabsContent value="signup">
          <SignupForm onSuccess={onAuthSuccess} onError={onAuthError} />
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground">
        {tab === "login" ? "Nie masz konta?" : "Masz już konto?"}{" "}
        <Button type="button" variant="link" className="h-auto p-0" onClick={switchTab}>
          {tab === "login" ? "Zarejestruj się" : "Zaloguj się"}
        </Button>
      </div>
    </div>
  );
}
