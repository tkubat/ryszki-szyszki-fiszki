/**
 * Data Transfer Objects (DTOs) and Command Models
 *
 * Types are derived from the database schema to keep API contracts aligned
 * with persisted entities.
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

export type RecipeEntity = Database["public"]["Tables"]["recipes"]["Row"];

export type RecipeId = RecipeEntity["id"];
export type RecipeCreatedAt = RecipeEntity["created_at"];
export type UserId = RecipeEntity["user_id"];

// ============================================================================
// Recipes DTOs and Commands
// ============================================================================

export type RecipeDTO = Pick<
  RecipeEntity,
  "id" | "title" | "ingredients" | "steps" | "liked" | "created_at"
>;

export interface RecipesListResponseDTO {
  data: RecipeDTO[];
  next_cursor: RecipeCreatedAt | null;
}

export interface RecipeIdParams {
  id: RecipeId;
}

export interface GetRecipesQuery {
  limit?: number;
  cursor?: RecipeCreatedAt;
  liked?: boolean;
}

export type CreateRecipeCommand = Pick<
  RecipeEntity,
  "title" | "ingredients" | "steps"
>;

export type UpdateRecipeLikedCommand = Pick<RecipeEntity, "liked">;

export interface GenerateRecipeCommand {
  ingredients: RecipeEntity["ingredients"];
  include_basics: boolean;
}

export interface GenerateRecipeResponseDTO {
  recipe: RecipeDTO;
  generation_time_ms: number;
}

// ============================================================================
// Auth DTOs and Commands
// ============================================================================

export interface AuthUserDTO {
  id: UserId;
  email: string;
}

export interface AuthSessionDTO {
  access_token: string;
  refresh_token: string;
}

export interface SignupCommand {
  email: string;
  password: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  user: AuthUserDTO;
  session: AuthSessionDTO;
}

// ============================================================================
// App Shell View Models
// ============================================================================

export interface ApiErrorDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type TabKey = "generate" | "recipes";

export interface HeaderUserVM {
  email: string;
  emailShort: string;
}

export type LogoutState = "idle" | "loading" | "error";

export interface AppShellVM {
  user: HeaderUserVM;
  activeTab: TabKey;
  logoutState: LogoutState;
  errorMessage?: string;
}

export interface AuthStorageModel {
  access_token: string;
  refresh_token: string;
  email: string;
  user_id: string;
}
