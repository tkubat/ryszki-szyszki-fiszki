import { Button } from "@/components/ui/button";
import type { SessionBootError } from "@/lib/auth/session.types";

interface SessionBootScreenProps {
  label?: string;
  error?: SessionBootError | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export default function SessionBootScreen({
  label = "Ładuję...",
  error,
  onRetry,
  isRetrying = false,
}: SessionBootScreenProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <div role="status" aria-live="polite" className="space-y-2">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive">{error.message}</p>
          {onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry} disabled={isRetrying}>
              {isRetrying ? "Ponawiam..." : "Spróbuj ponownie"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
