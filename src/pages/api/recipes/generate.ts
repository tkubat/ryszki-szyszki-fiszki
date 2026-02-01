import type { APIRoute } from "astro";
import { z } from "zod";

import type { GenerateRecipeCommand, GenerateRecipeResponseDTO } from "../../../types";
import { generateRecipe, RecipeGenerationError } from "../../../lib/services/recipes.generate";

export const prerender = false;

const INGREDIENTS_SPLIT_REGEX = /[,;\n]+/;
const INGREDIENTS_MIN_COUNT = 3;
const INGREDIENTS_MAX_LENGTH = 2000;

/**
 * POST /api/recipes/generate
 *
 * Generates a recipe using AI based on provided ingredients,
 * saves it to the database, and returns the created record.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(401, "UNAUTHORIZED", "Authentication required");
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "BAD_REQUEST", "Request body must be valid JSON");
    }
    const parsed = generateRecipeSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request payload";
      return jsonError(400, "BAD_REQUEST", message, { issues: parsed.error.issues });
    }

    const command: GenerateRecipeCommand = parsed.data;
    const { recipe, generation_time_ms } = await generateRecipe(command);

    const { data: insertedRecipe, error: insertError } = await locals.supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        liked: false,
      })
      .select("id, title, ingredients, steps, liked, created_at")
      .single();

    if (insertError || !insertedRecipe) {
      console.error("Failed to insert recipe:", insertError?.message);
      return jsonError(500, "DATABASE_ERROR", "Failed to save generated recipe");
    }

    const response: GenerateRecipeResponseDTO = {
      recipe: insertedRecipe,
      generation_time_ms,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof RecipeGenerationError) {
      return jsonError(error.status, error.code, error.message, error.details);
    }

    console.error("Unexpected error in POST /api/recipes/generate:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
};

const generateRecipeSchema = z
  .object({
    ingredients: z.string().trim().min(1, "Ingredients are required").max(INGREDIENTS_MAX_LENGTH),
    include_basics: z.boolean(),
  })
  .superRefine((data, context) => {
    const ingredientsCount = splitIngredients(data.ingredients).length;

    if (ingredientsCount < INGREDIENTS_MIN_COUNT) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Provide at least ${INGREDIENTS_MIN_COUNT} ingredients`,
        path: ["ingredients"],
      });
    }
  });

function splitIngredients(ingredients: string): string[] {
  return ingredients
    .split(INGREDIENTS_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
}

function jsonError(status: number, code: string, message: string, details?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        details,
      },
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
