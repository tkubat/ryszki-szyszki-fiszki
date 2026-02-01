import type { GenerateRecipeResponseDTO } from "@/types";

export type GenerateRecipeStatus = "idle" | "submitting" | "success" | "error";

export type GenerateRecipeErrorKind =
  | "validation"
  | "unauthorized"
  | "timeout"
  | "provider"
  | "network"
  | "server"
  | "unknown";

export interface GenerateRecipeErrorVM {
  kind: GenerateRecipeErrorKind;
  title: string;
  message: string;
  retryable: boolean;
  httpStatus?: number;
  apiCode?: string;
}

export interface GenerateRecipeViewState {
  status: GenerateRecipeStatus;
  ingredients: string;
  fieldError: string | null;
  result: GenerateRecipeResponseDTO | null;
  error: GenerateRecipeErrorVM | null;
}

export interface RecipeStepsVM {
  stepsRaw: string;
  stepsList: string[];
}
