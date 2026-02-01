import type { APIRoute } from "astro";
import { z } from "zod";

import type { RecipeDTO, RecipeIdParams, UpdateRecipeLikedCommand } from "../../../types";
import { updateRecipeLiked } from "../../../lib/services/recipes.service";

export const prerender = false;

const paramsSchema = z.object({
  id: z.string().uuid("Recipe id must be a valid UUID"),
});

const bodySchema = z.object({
  liked: z.boolean({
    invalid_type_error: "Liked must be a boolean",
    required_error: "Liked is required",
  }),
});

/**
 * PATCH /api/recipes/:id
 *
 * Updates the liked status of a recipe that belongs to the authenticated user.
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(401, "UNAUTHORIZED", "Authentication required");
    }

    const parsedParams = paramsSchema.safeParse({
      id: params.id,
    });

    if (!parsedParams.success) {
      const message = parsedParams.error.issues[0]?.message ?? "Invalid path parameters";
      return jsonError(400, "BAD_REQUEST", message, { issues: parsedParams.error.issues });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "BAD_REQUEST", "Request body must be valid JSON");
    }

    const parsedBody = bodySchema.safeParse(body);

    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message ?? "Invalid request payload";
      return jsonError(400, "BAD_REQUEST", message, { issues: parsedBody.error.issues });
    }

    const command: UpdateRecipeLikedCommand = parsedBody.data;
    const recipeIdParams: RecipeIdParams = parsedParams.data;

    const updatedRecipe = await updateRecipeLiked(
      locals.supabase,
      user.id,
      recipeIdParams.id,
      command.liked,
    );

    if (!updatedRecipe) {
      return jsonError(404, "NOT_FOUND", "Recipe not found");
    }

    const response: RecipeDTO = updatedRecipe;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/recipes/:id:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
};

/**
 * Builds consistent JSON error responses for API routes.
 */
function jsonError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Response {
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
    },
  );
}
