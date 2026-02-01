import type { APIRoute } from "astro";
import { z } from "zod";

import type { AuthResponseDTO, LoginCommand } from "../../../types";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().trim().email("Email must be a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * POST /api/auth/login
 *
 * Authenticates a user using Supabase Auth and returns the session tokens.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(400, "BAD_REQUEST", "Request body must be valid JSON");
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request payload";
      return jsonError(400, "BAD_REQUEST", message, { issues: parsed.error.issues });
    }

    const command: LoginCommand = parsed.data;
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password,
    });

    if (error || !data.user || !data.session) {
      if (error) {
        console.error("Login failed:", error.message);
      }

      return jsonError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    if (!data.user.email) {
      console.error("Login succeeded but user email is missing");
      return jsonError(500, "INTERNAL_SERVER_ERROR", "Failed to build auth response");
    }

    const response: AuthResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/auth/login:", error);
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
