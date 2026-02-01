import type { AuthErrorVM } from "@/lib/auth/auth.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthErrorAlertProps {
  error: AuthErrorVM | null;
  onDismiss?: () => void;
}

export function AuthErrorAlert({ error, onDismiss }: AuthErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className="flex items-start justify-between gap-4">
      <div>
        <AlertTitle>Coś poszło nie tak</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
        >
          Zamknij
        </button>
      ) : null}
    </Alert>
  );
}
