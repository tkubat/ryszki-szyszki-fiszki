import { useCallback, useMemo } from "react";

import { getAccessToken } from "@/lib/auth/auth.storage";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { useToggleRecipeLiked } from "@/lib/hooks/useToggleRecipeLiked";
import type { RecipeDTO } from "@/types";

import type { RecipeCardViewModel } from "@/lib/recipes/recipes.types";
import { RecipesList } from "./RecipesList";

export interface RecipesTabProps {
  onNavigateToGenerate: () => void;
  onUnauthorized: () => void;
}

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateLabel(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Nieznana data";
  }

  return dateFormatter.format(date);
}

function toRecipeCardViewModel(recipe: RecipeDTO): RecipeCardViewModel {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    liked: recipe.liked,
    createdAtISO: recipe.created_at,
    createdAtLabel: formatDateLabel(recipe.created_at),
  };
}

export function RecipesTab({ onNavigateToGenerate, onUnauthorized }: RecipesTabProps) {
  const accessToken = getAccessToken();
  const { recipes, setRecipes, isLoading, error, refetch } = useRecipes({
    accessToken,
    onUnauthorized,
  });

  const {
    toggle,
    pendingIds,
    error: toggleError,
    clearError,
  } = useToggleRecipeLiked({
    accessToken,
    onUnauthorized,
    onNotFound: refetch,
    setRecipes,
  });

  const recipeViewModels = useMemo(
    () => recipes.map(toRecipeCardViewModel),
    [recipes],
  );

  const handleToggleLiked = useCallback(
    (recipeId: string, nextLiked: boolean) => {
      clearError();
      void toggle(recipeId, nextLiked);
    },
    [clearError, toggle],
  );

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Moje przepisy</h2>
        <p className="text-sm text-muted-foreground">
          Twoje zapisane przepisy od najnowszych.
        </p>
      </header>

      <RecipesList
        isLoading={isLoading}
        error={error}
        recipes={recipeViewModels}
        pendingIds={pendingIds}
        toggleError={toggleError}
        onRetry={refetch}
        onToggleLiked={handleToggleLiked}
        onNavigateToGenerate={onNavigateToGenerate}
      />
    </section>
  );
}
