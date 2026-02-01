import type { GetRecipesQuery, RecipeCreatedAt, RecipeDTO, RecipesListResponseDTO } from "@/types";

import { apiFetch, type ApiContext } from "./apiClient";

const RECIPES_PAGE_LIMIT = 100;
const MAX_PAGES = 50;

export async function fetchRecipesPage(query: GetRecipesQuery, context: ApiContext): Promise<RecipesListResponseDTO> {
  const params = new URLSearchParams();

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.cursor) {
    params.set("cursor", query.cursor);
  }

  if (typeof query.liked === "boolean") {
    params.set("liked", String(query.liked));
  }

  const url = params.size ? `/api/recipes?${params.toString()}` : "/api/recipes";

  return apiFetch<RecipesListResponseDTO>(url, { method: "GET" }, context);
}

export async function fetchAllRecipes(context: ApiContext): Promise<RecipeDTO[]> {
  const recipes: RecipeDTO[] = [];
  let cursor: RecipeCreatedAt | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchRecipesPage({ limit: RECIPES_PAGE_LIMIT, cursor: cursor ?? undefined }, context);

    recipes.push(...response.data);

    if (!response.next_cursor || response.next_cursor === cursor) {
      break;
    }

    cursor = response.next_cursor;
  }

  return recipes;
}

export async function patchRecipeLiked(recipeId: string, liked: boolean, context: ApiContext): Promise<RecipeDTO> {
  return apiFetch<RecipeDTO>(`/api/recipes/${recipeId}`, { method: "PATCH", body: { liked } }, context);
}
