import { useMemo } from "react";

interface RecipeStepsRendererProps {
  steps: string;
}

export function RecipeStepsRenderer({ steps }: RecipeStepsRendererProps) {
  const stepList = useMemo(() => buildStepList(steps), [steps]);

  if (!steps.trim()) {
    return <p className="text-sm text-muted-foreground">Brak kroków.</p>;
  }

  if (stepList.length > 1) {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
        {stepList.map((step, index) => (
          <li key={`${index}-${step.slice(0, 16)}`}>{step}</li>
        ))}
      </ol>
    );
  }

  return (
    <div className="space-y-2 text-sm text-foreground">
      {steps
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
        ))}
    </div>
  );
}

function buildStepList(steps: string): string[] {
  const lines = steps
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map(stripNumbering);
  }

  const numbered = steps
    .split(/\s*\d+[).:-]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (numbered.length > 1) {
    return numbered;
  }

  return [];
}

function stripNumbering(line: string): string {
  return line.replace(/^\d+[).:-]\s*/, "");
}
