import AppShell from "@/components/app/AppShell";
import AuthGate from "@/components/session/AuthGate";
import SessionProvider from "@/components/session/SessionProvider";

export default function AppEntry() {
  return (
    <SessionProvider>
      <AuthGate mode="require-auth">
        <AppShell />
      </AuthGate>
    </SessionProvider>
  );
}
