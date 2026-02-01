import type { APIRoute } from "astro";
import { z } from "zod";

import type {
  CreateRecipeCommand,
  GetRecipesQuery,
  RecipeDTO,
  RecipesListResponseDTO,
} from "../../../types";
import { createRecipe, getRecipes } from "../../../lib/services/recipes.service";

export const prerender = false;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const querySchema = z.object({
  limit: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }

        if (typeof value === "string") {
          return Number(value);
        }

        return value;
      },
      z
        .number({
          invalid_type_error: "Limit must be a number",
        })
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(MAX_LIMIT, `Limit must be at most ${MAX_LIMIT}`),
    )
    .default(DEFAULT_LIMIT),
  cursor: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }

        return value;
      },
      z
        .string({
          invalid_type_error: "Cursor must be a string",
        })
        .datetime({ offset: true, message: "Cursor must be a valid ISO8601 timestamp" })
        .optional(),
    )
    .optional(),
  liked: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }

      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      return value;
    },
    z.boolean({
      invalid_type_error: "Liked must be a boolean",
    }).optional(),
  ),
});

const createRecipeSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  ingredients: z.string().trim().min(1, "Ingredients are required"),
  steps: z.string().trim().min(1, "Steps are required"),
});

/**
 * GET /api/recipes
 *
 * Returns recipes for the authenticated user with optional liked filter and cursor pagination.
 */
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(401, "UNAUTHORIZED", "Authentication required");
    }

    const url = new URL(request.url);
    const rawQuery = {
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      liked: url.searchParams.get("liked") ?? undefined,
    };

    const parsed = querySchema.safeParse(rawQuery);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid query parameters";
      return jsonError(400, "BAD_REQUEST", message, { issues: parsed.error.issues });
    }

    const query: GetRecipesQuery = parsed.data;
    const response: RecipesListResponseDTO = await getRecipes(locals.supabase, user.id, query);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/recipes:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
};

/**
 * POST /api/recipes
 *
 * Creates a new recipe for the authenticated user.
 */
export const POST: APIRoute = async ({ locals, request }) => {
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

    const parsed = createRecipeSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request payload";
      return jsonError(400, "BAD_REQUEST", message, { issues: parsed.error.issues });
    }

    const command: CreateRecipeCommand = parsed.data;
    const recipe = await createRecipe(locals.supabase, user.id, command);

    const response: RecipeDTO = recipe;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/recipes:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
};

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
