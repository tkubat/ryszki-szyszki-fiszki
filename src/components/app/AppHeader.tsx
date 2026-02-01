import type { HeaderUserVM, LogoutState } from "@/types";

import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  user: HeaderUserVM;
  logoutState: LogoutState;
  onLogout: () => void;
}

export default function AppHeader({ user, logoutState, onLogout }: AppHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ryszki Szyszki Fiszki</p>
        <h1 className="text-2xl font-semibold text-foreground">Twoje przepisy</h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          aria-label={`Zalogowany jako ${user.email}`}
        >
          {user.emailShort}
        </div>
        <Button onClick={onLogout} disabled={logoutState === "loading"}>
          {logoutState === "loading" ? "Wylogowywanie..." : "Wyloguj"}
        </Button>
      </div>
    </header>
  );
}
