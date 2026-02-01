import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { GenerateRecipeErrorVM } from "@/components/generate/types";

interface GenerateErrorAlertProps {
  error: GenerateRecipeErrorVM;
  onRetry: () => void;
}

export function GenerateErrorAlert({ error, onRetry }: GenerateErrorAlertProps) {
  return (
    <Alert variant="destructive" className="space-y-3">
      <div>
        <AlertTitle>{error.title}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </div>
      {error.retryable ? (
        <Button variant="outline" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      ) : null}
    </Alert>
  );
}
