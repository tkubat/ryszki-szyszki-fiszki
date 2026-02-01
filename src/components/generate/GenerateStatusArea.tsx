import { GenerateErrorAlert } from "@/components/generate/GenerateErrorAlert";
import { GeneratingSkeleton } from "@/components/generate/GeneratingSkeleton";
import { RecipeResultCard } from "@/components/generate/RecipeResultCard";
import type { GenerateRecipeViewState } from "@/components/generate/types";

interface GenerateStatusAreaProps {
  state: GenerateRecipeViewState;
  onRetry: () => void;
  onGenerateAnother: () => void;
}

export function GenerateStatusArea({ state, onRetry, onGenerateAnother }: GenerateStatusAreaProps) {
  if (state.status === "submitting") {
    return <GeneratingSkeleton />;
  }

  if (state.status === "error" && state.error) {
    return <GenerateErrorAlert error={state.error} onRetry={onRetry} />;
  }

  if (state.status === "success" && state.result) {
    return (
      <RecipeResultCard
        recipe={state.result.recipe}
        generationTimeMs={state.result.generation_time_ms}
        onGenerateAnother={onGenerateAnother}
      />
    );
  }

  return null;
}
