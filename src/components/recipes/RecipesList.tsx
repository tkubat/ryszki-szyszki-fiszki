import type {
  RecipeCardViewModel,
  RecipesListErrorViewModel,
  ToggleLikedErrorViewModel,
} from "@/lib/recipes/recipes.types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { RecipeCard } from "./RecipeCard";
import { RecipesEmptyState } from "./RecipesEmptyState";
import { RecipesListSkeleton } from "./RecipesListSkeleton";

export interface RecipesListProps {
  isLoading: boolean;
  error: RecipesListErrorViewModel | null;
  recipes: RecipeCardViewModel[];
  pendingIds: Set<string>;
  toggleError: ToggleLikedErrorViewModel | null;
  onRetry: () => void;
  onToggleLiked: (recipeId: string, nextLiked: boolean) => void;
  onNavigateToGenerate: () => void;
}

export function RecipesList({
  isLoading,
  error,
  recipes,
  pendingIds,
  toggleError,
  onRetry,
  onToggleLiked,
  onNavigateToGenerate,
}: RecipesListProps) {
  if (isLoading) {
    return <RecipesListSkeleton items={6} />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Nie udało się pobrać przepisów</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
        <Button type="button" variant="outline" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  if (recipes.length === 0) {
    return <RecipesEmptyState onNavigateToGenerate={onNavigateToGenerate} />;
  }

  return (
    <div className="space-y-4">
      {toggleError ? (
        <Alert>
          <AlertTitle>Nie udało się zapisać polubienia</AlertTitle>
          <AlertDescription>{toggleError.message}</AlertDescription>
        </Alert>
      ) : null}

      <ul className="space-y-4">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard recipe={recipe} isPending={pendingIds.has(recipe.id)} onToggleLiked={onToggleLiked} />
          </li>
        ))}
      </ul>
    </div>
  );
}
