export interface RecipeCardViewModel {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  liked: boolean;
  createdAtISO: string;
  createdAtLabel: string;
}

export type RecipesListErrorKind = "UNAUTHORIZED" | "NETWORK" | "SERVER" | "BAD_REQUEST" | "UNKNOWN";

export interface RecipesListErrorViewModel {
  kind: RecipesListErrorKind;
  message: string;
  status?: number;
  code?: string;
}

export type ToggleLikedErrorKind = "UNAUTHORIZED" | "NOT_FOUND" | "NETWORK" | "SERVER" | "BAD_REQUEST" | "UNKNOWN";

export interface ToggleLikedErrorViewModel {
  kind: ToggleLikedErrorKind;
  message: string;
  status?: number;
  code?: string;
  recipeId: string;
}
