import type { APIRoute } from "astro";
import { z } from "zod";

import type { AuthResponseDTO, SignupCommand } from "../../../types";
import { AuthServiceError, signup } from "../../../lib/services/auth.service";

export const prerender = false;

const signupSchema = z.object({
  email: z.string().trim().email("Email must be a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * POST /api/auth/signup
 *
 * Creates a new user account in Supabase Auth and returns session tokens.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "BAD_REQUEST", "Request body must be valid JSON");
    }

    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request payload";
      return jsonError(400, "BAD_REQUEST", message, { issues: parsed.error.issues });
    }

    const command: SignupCommand = parsed.data;
    const response: AuthResponseDTO = await signup(locals.supabase, command);

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      if (error.status >= 500) {
        console.error("Signup failed:", error.message);
      }

      return jsonError(error.status, error.code, error.message, error.details);
    }

    console.error("Unexpected error in POST /api/auth/signup:", error);
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
