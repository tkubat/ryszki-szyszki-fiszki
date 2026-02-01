import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api/apiClient";
import { fetchAllRecipes } from "@/lib/api/recipesApi";
import type { RecipeDTO } from "@/types";

import type { RecipesListErrorViewModel } from "../recipes/recipes.types";

export interface UseRecipesOptions {
  accessToken: string | null;
  onUnauthorized: () => void;
}

interface UseRecipesState {
  recipes: RecipeDTO[];
  isLoading: boolean;
  error: RecipesListErrorViewModel | null;
}

function mapRecipesError(error: unknown): RecipesListErrorViewModel {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      console.error("Invalid recipes list request:", error);
      return {
        kind: "BAD_REQUEST",
        message: "Nie udało się pobrać przepisów. Spróbuj ponownie.",
        status: error.status,
        code: error.code,
      };
    }

    if (error.status === 401) {
      return {
        kind: "UNAUTHORIZED",
        message: "Sesja wygasła. Zaloguj się ponownie.",
        status: error.status,
        code: error.code,
      };
    }

    if (error.status >= 500) {
      return {
        kind: "SERVER",
        message: "Nie udało się pobrać przepisów. Spróbuj ponownie.",
        status: error.status,
        code: error.code,
      };
    }

    return {
      kind: "UNKNOWN",
      message: "Nie udało się pobrać przepisów. Spróbuj ponownie.",
      status: error.status,
      code: error.code,
    };
  }

  if (error instanceof TypeError) {
    return {
      kind: "NETWORK",
      message: "Brak połączenia. Spróbuj ponownie.",
    };
  }

  return {
    kind: "UNKNOWN",
    message: "Nie udało się pobrać przepisów. Spróbuj ponownie.",
  };
}

export function useRecipes({ accessToken, onUnauthorized }: UseRecipesOptions) {
  const [state, setState] = useState<UseRecipesState>({
    recipes: [],
    isLoading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (!accessToken) {
      onUnauthorized();
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fetchAllRecipes({ accessToken, onUnauthorized });
      setState({ recipes: data, isLoading: false, error: null });
    } catch (error) {
      const mapped = mapRecipesError(error);
      if (mapped.kind === "UNAUTHORIZED") {
        onUnauthorized();
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: mapped,
      }));
    }
  }, [accessToken, onUnauthorized]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    recipes: state.recipes,
    setRecipes: (next: RecipeDTO[] | ((prev: RecipeDTO[]) => RecipeDTO[])) => {
      setState((prev) => ({
        ...prev,
        recipes: typeof next === "function" ? next(prev.recipes) : next,
      }));
    },
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}
