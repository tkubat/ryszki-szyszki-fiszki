import type { AuthResponseDTO } from "@/types";

export type AuthTab = "login" | "signup";

export type AuthFieldName = "email" | "password";

export interface FieldErrorsVM {
  email?: string;
  password?: string;
  form?: string;
}

export interface AuthFormState {
  values: {
    email: string;
    password: string;
  };
  errors: FieldErrorsVM;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AuthErrorVM {
  kind: "validation" | "unauthorized" | "conflict" | "network" | "server" | "unknown";
  message: string;
  status?: number;
  details?: unknown;
}

export interface AuthSessionVM {
  user: AuthResponseDTO["user"];
  access_token: AuthResponseDTO["session"]["access_token"];
  refresh_token: AuthResponseDTO["session"]["refresh_token"];
}
