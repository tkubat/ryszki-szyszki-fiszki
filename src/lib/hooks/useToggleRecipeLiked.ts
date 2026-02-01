import { useCallback, useState } from "react";

import { ApiError } from "@/lib/api/apiClient";
import { patchRecipeLiked } from "@/lib/api/recipesApi";
import type { RecipeDTO } from "@/types";

import type { ToggleLikedErrorViewModel } from "../recipes/recipes.types";

export interface UseToggleRecipeLikedOptions {
  accessToken: string | null;
  onUnauthorized: () => void;
  onNotFound: () => void;
  setRecipes: (next: RecipeDTO[] | ((prev: RecipeDTO[]) => RecipeDTO[])) => void;
}

function mapToggleError(error: unknown, recipeId: string): ToggleLikedErrorViewModel {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return {
        kind: "NOT_FOUND",
        message: "Ten przepis nie jest już dostępny. Lista została odświeżona.",
        status: error.status,
        code: error.code,
        recipeId,
      };
    }

    if (error.status === 401) {
      return {
        kind: "UNAUTHORIZED",
        message: "Sesja wygasła. Zaloguj się ponownie.",
        status: error.status,
        code: error.code,
        recipeId,
      };
    }

    if (error.status === 400) {
      console.error("Invalid toggle liked payload:", error);
      return {
        kind: "BAD_REQUEST",
        message: "Nie udało się zapisać polubienia. Spróbuj ponownie.",
        status: error.status,
        code: error.code,
        recipeId,
      };
    }

    if (error.status >= 500) {
      return {
        kind: "SERVER",
        message: "Nie udało się zapisać polubienia. Spróbuj ponownie.",
        status: error.status,
        code: error.code,
        recipeId,
      };
    }

    return {
      kind: "UNKNOWN",
      message: "Nie udało się zapisać polubienia. Spróbuj ponownie.",
      status: error.status,
      code: error.code,
      recipeId,
    };
  }

  if (error instanceof TypeError) {
    return {
      kind: "NETWORK",
      message: "Brak połączenia. Spróbuj ponownie.",
      recipeId,
    };
  }

  return {
    kind: "UNKNOWN",
    message: "Nie udało się zapisać polubienia. Spróbuj ponownie.",
    recipeId,
  };
}

export function useToggleRecipeLiked({
  accessToken,
  onUnauthorized,
  onNotFound,
  setRecipes,
}: UseToggleRecipeLikedOptions) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<ToggleLikedErrorViewModel | null>(null);

  const toggle = useCallback(
    async (recipeId: string, nextLiked: boolean) => {
      if (pendingIds.has(recipeId)) {
        return;
      }

      if (!accessToken) {
        onUnauthorized();
        return;
      }

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(recipeId);
        return next;
      });

      setError(null);

      let previousLiked: boolean | null = null;

      setRecipes((prev) =>
        prev.map((recipe) => {
          if (recipe.id !== recipeId) {
            return recipe;
          }

          previousLiked = recipe.liked;
          return { ...recipe, liked: nextLiked };
        }),
      );

      try {
        const updated = await patchRecipeLiked(recipeId, nextLiked, {
          accessToken,
          onUnauthorized,
        });

        setRecipes((prev) =>
          prev.map((recipe) => (recipe.id === recipeId ? updated : recipe)),
        );
      } catch (caught) {
        const mapped = mapToggleError(caught, recipeId);

        if (mapped.kind === "UNAUTHORIZED") {
          onUnauthorized();
          return;
        }

        if (previousLiked !== null) {
          setRecipes((prev) =>
            prev.map((recipe) =>
              recipe.id === recipeId ? { ...recipe, liked: previousLiked } : recipe,
            ),
          );
        }

        if (mapped.kind === "NOT_FOUND") {
          onNotFound();
        }

        setError(mapped);
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      }
    },
    [accessToken, onNotFound, onUnauthorized, pendingIds, setRecipes],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { toggle, pendingIds, error, clearError };
}
