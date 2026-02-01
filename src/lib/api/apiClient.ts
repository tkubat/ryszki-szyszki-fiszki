import type { ApiErrorResponse } from "@/lib/auth/auth.types";

export interface ApiContext {
  accessToken: string | null;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
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

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeError = (value as ApiErrorResponse).error;
  return Boolean(maybeError?.code && maybeError?.message);
}

function buildBody(body: BodyInit | Record<string, unknown> | null | undefined): BodyInit | undefined {
  if (!body) {
    return undefined;
  }

  if (typeof body === "string" || body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
}

async function readResponseJson<T>(response: Response): Promise<T | undefined> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(response.status, "INVALID_JSON", "Response body is not valid JSON");
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  context: ApiContext
): Promise<T> {
  if (!context.accessToken) {
    context.onUnauthorized?.();
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const headers = new Headers(init?.headers);
  const normalizedBody = buildBody(init?.body as BodyInit | Record<string, unknown> | null | undefined);

  if (normalizedBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${context.accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
    body: normalizedBody,
  });

  if (response.ok) {
    const data = await readResponseJson<T>(response);
    return data as T;
  }

  const errorPayload = await readResponseJson<unknown>(response);
  let code = "UNKNOWN";
  let message = response.statusText || "Request failed";
  let details: Record<string, unknown> | undefined;

  if (isApiErrorResponse(errorPayload)) {
    code = errorPayload.error.code;
    message = errorPayload.error.message;
    details = errorPayload.error.details;
  }

  if (response.status === 401) {
    context.onUnauthorized?.();
  }

  throw new ApiError(response.status, code, message, details);
}
