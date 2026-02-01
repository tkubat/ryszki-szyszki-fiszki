import AuthView from "@/components/auth/AuthView";
import AuthGate from "@/components/session/AuthGate";
import SessionProvider from "@/components/session/SessionProvider";

export default function AuthEntry() {
  return (
    <SessionProvider>
      <AuthGate mode="require-unauth">
        <AuthView />
      </AuthGate>
    </SessionProvider>
  );
}
