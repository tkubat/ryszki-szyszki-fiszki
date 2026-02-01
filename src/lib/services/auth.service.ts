import type { SupabaseClient } from "../../db/supabase.client";
import type { AuthResponseDTO, SignupCommand } from "../../types";

export class AuthServiceError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Registers a new user using Supabase Auth.
 *
 * @param supabase - Authenticated Supabase client instance
 * @param command - Signup payload with email and password
 * @returns AuthResponseDTO with user info and session tokens
 * @throws AuthServiceError if signup fails or response is incomplete
 */
export async function signup(supabase: SupabaseClient, command: SignupCommand): Promise<AuthResponseDTO> {
  const { data, error } = await supabase.auth.signUp({
    email: command.email,
    password: command.password,
  });

  if (error) {
    if (isDuplicateEmailError(error.message)) {
      throw new AuthServiceError(409, "CONFLICT", "Email already exists");
    }

    throw new AuthServiceError(500, "INTERNAL_SERVER_ERROR", `Failed to sign up: ${error.message}`, {
      reason: error.message,
    });
  }

  if (!data.user || !data.session) {
    throw new AuthServiceError(500, "INTERNAL_SERVER_ERROR", "Failed to create signup session");
  }

  if (!data.user.email) {
    throw new AuthServiceError(500, "INTERNAL_SERVER_ERROR", "Failed to build auth response");
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  };
}

function isDuplicateEmailError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("duplicate")
  );
}
