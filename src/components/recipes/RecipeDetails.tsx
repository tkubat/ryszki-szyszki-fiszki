import { useMemo } from "react";

export interface RecipeDetailsProps {
  ingredients: string;
  steps: string;
}

function splitSteps(steps: string): string[] {
  return steps
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function RecipeDetails({ ingredients, steps }: RecipeDetailsProps) {
  const stepItems = useMemo(() => splitSteps(steps), [steps]);
  const hasList = stepItems.length > 1;

  return (
    <details className="group rounded-lg border border-border px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-primary">
        <span className="group-open:hidden">Pokaż szczegóły</span>
        <span className="hidden group-open:inline">Ukryj szczegóły</span>
      </summary>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Składniki
          </h4>
          <p className="mt-2 whitespace-pre-line">{ingredients}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kroki
          </h4>
          <div className="mt-2">
            {hasList ? (
              <ol className="list-decimal space-y-2 pl-5">
                {stepItems.map((step, index) => (
                  <li key={`${index}-${step}`}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="whitespace-pre-line">{steps}</p>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
