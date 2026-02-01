import type { APIRoute } from "astro";

import { getUserProfile } from "../../../lib/services/profile.service";
import type { ProfileDTO, ErrorResponseDTO } from "../../../types";

/**
 * Disable prerendering for this API route
 * Required for all dynamic API endpoints in Astro
 */
export const prerender = false;

/**
 * GET /api/v1/profile
 *
 * Retrieves the authenticated user's profile with AI usage information.
 *
 * Features:
 * - Requires authentication via Supabase Auth JWT token
 * - Automatically resets monthly AI flashcard limit if reset date has passed
 * - Returns computed ai_flashcards_remaining field (100 - used)
 * - Protected by Row Level Security (RLS) - users can only access their own profile
 *
 * Success Response (200):
 * {
 *   "id": "uuid",
 *   "ai_flashcards_used": 45,
 *   "ai_flashcards_remaining": 55,
 *   "limit_reset_date": "2026-03-01",
 *   "created_at": "2026-01-15T10:30:00.000Z",
 *   "updated_at": "2026-01-31T14:20:00.000Z"
 * }
 *
 * Error Responses:
 * - 401: Authentication required (missing or invalid token)
 * - 404: Profile not found (edge case - should not occur normally)
 * - 500: Internal server error (database errors, unexpected errors)
 *
 * @param locals - Astro context locals containing authenticated Supabase client
 * @returns Response with ProfileDTO or ErrorResponseDTO
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Verify user authentication
    // getUser() validates the JWT token and returns user data
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError?.message);

      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Fetch user profile through service layer
    // Service handles AI limit reset check and profile retrieval
    let profile = await getUserProfile(locals.supabase, user.id);

    // Step 3: Handle edge case - profile not found
    // This should not occur normally due to on_auth_user_created trigger
    // If profile doesn't exist, try to create it as a fallback
    if (!profile) {
      console.warn("Profile not found for user, attempting to create:", user.id);

      // Calculate next month's first day for limit_reset_date
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const limitResetDate = nextMonth.toISOString().split("T")[0];

      // Attempt to create profile
      const { error: createError } = await locals.supabase.from("profiles").insert({
        id: user.id,
        ai_flashcards_used: 0,
        limit_reset_date: limitResetDate,
      });

      if (createError) {
        console.error("Failed to create profile:", createError);

        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "User profile not found and could not be created",
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Retry fetching profile after creation
      profile = await getUserProfile(locals.supabase, user.id);

      if (!profile) {
        const errorResponse: ErrorResponseDTO = {
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "User profile not found",
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Step 4: Return successful response
    const response: ProfileDTO = profile;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache for 5 minutes on client side only (private cache)
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    // Step 5: Handle unexpected errors
    // Log full error details for debugging
    console.error("Error in GET /api/v1/profile:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response (don't expose internal details)
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        details: {
          error_type: "unexpected_error",
        },
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
