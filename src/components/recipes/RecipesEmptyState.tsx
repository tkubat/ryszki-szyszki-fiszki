import { Button } from "@/components/ui/button";

export interface RecipesEmptyStateProps {
  onNavigateToGenerate: () => void;
}

export function RecipesEmptyState({ onNavigateToGenerate }: RecipesEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border p-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Nie masz jeszcze zapisanych przepisów</h3>
        <p className="text-sm text-muted-foreground">Wygeneruj pierwszy przepis, a pojawi się na liście.</p>
      </div>
      <Button type="button" onClick={onNavigateToGenerate}>
        Przejdź do Generuj
      </Button>
    </div>
  );
}
