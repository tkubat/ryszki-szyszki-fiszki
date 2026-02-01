import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Logs out the currently authenticated user by invalidating the Supabase session.
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await locals.supabase.auth.getSession();

    if (sessionError || !session) {
      if (sessionError) {
        console.error("Logout session lookup failed:", sessionError.message);
      }

      return jsonError(401, "UNAUTHORIZED", "Authentication required");
    }

    const { error: signOutError } = await locals.supabase.auth.signOut();

    if (signOutError) {
      console.error("Logout failed:", signOutError.message);
      return jsonError(500, "INTERNAL_SERVER_ERROR", "Failed to log out");
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/logout:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
  }
};

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
