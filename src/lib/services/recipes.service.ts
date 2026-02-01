import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateRecipeCommand, GetRecipesQuery, RecipeDTO, RecipesListResponseDTO } from "../../types";

const DEFAULT_LIMIT = 20;

/**
 * Retrieves recipes for the authenticated user with optional filtering and pagination.
 *
 * @param supabase - Authenticated Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param query - Query parameters for filtering and pagination
 * @returns RecipesListResponseDTO with data and next_cursor
 * @throws Error if database query fails
 */
export async function getRecipes(
  supabase: SupabaseClient,
  userId: string,
  query: GetRecipesQuery
): Promise<RecipesListResponseDTO> {
  const limit = query.limit ?? DEFAULT_LIMIT;

  let dbQuery = supabase
    .from("recipes")
    .select("id, title, ingredients, steps, liked, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query.cursor) {
    dbQuery = dbQuery.lt("created_at", query.cursor);
  }

  if (typeof query.liked === "boolean") {
    dbQuery = dbQuery.eq("liked", query.liked);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(`Failed to fetch recipes: ${error.message}`);
  }

  const recipes = (data ?? []) as RecipeDTO[];
  const next_cursor = recipes.length === limit ? (recipes[recipes.length - 1]?.created_at ?? null) : null;

  return { data: recipes, next_cursor };
}

/**
 * Creates a recipe for the authenticated user.
 *
 * @param supabase - Authenticated Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param command - Payload for the recipe creation
 * @returns Created RecipeDTO
 * @throws Error if database insert fails
 */
export async function createRecipe(
  supabase: SupabaseClient,
  userId: string,
  command: CreateRecipeCommand
): Promise<RecipeDTO> {
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: command.title,
      ingredients: command.ingredients,
      steps: command.steps,
      liked: false,
    })
    .select("id, title, ingredients, steps, liked, created_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create recipe: ${error?.message ?? "Unknown error"}`);
  }

  return data as RecipeDTO;
}

/**
 * Updates the liked status for a specific recipe owned by the authenticated user.
 *
 * @param supabase - Authenticated Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param recipeId - UUID of the recipe to update
 * @param liked - Desired liked status
 * @returns Updated RecipeDTO or null if not found/unauthorized
 * @throws Error if database update fails
 */
export async function updateRecipeLiked(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string,
  liked: boolean
): Promise<RecipeDTO | null> {
  const { data, error } = await supabase
    .from("recipes")
    .update({ liked })
    .eq("id", recipeId)
    .eq("user_id", userId)
    .select("id, title, ingredients, steps, liked, created_at")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update recipe: ${error.message}`);
  }

  return (data ?? null) as RecipeDTO | null;
}
