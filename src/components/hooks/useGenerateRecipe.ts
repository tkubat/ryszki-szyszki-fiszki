import { useCallback, useRef } from "react";

import type { GenerateRecipeCommand, GenerateRecipeResponseDTO } from "@/types";
import type { GenerateRecipeErrorVM } from "@/components/generate/types";
import { getAccessToken } from "@/lib/auth/auth.storage";

const REQUEST_TIMEOUT_MS = 65_000;

export class GenerateRecipeRequestError extends Error {
  readonly error: GenerateRecipeErrorVM;

  constructor(error: GenerateRecipeErrorVM) {
    super(error.message);
    this.error = error;
  }
}

export function useGenerateRecipe() {
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (command: GenerateRecipeCommand): Promise<GenerateRecipeResponseDTO> => {
    const token = getAccessToken();

    if (!token) {
      throw new GenerateRecipeRequestError({
        kind: "unauthorized",
        title: "Wymagane logowanie",
        message: "Zaloguj się ponownie, aby generować przepisy.",
        retryable: false,
        httpStatus: 401,
      });
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(command),
        signal: controller.signal,
      });

      const payload = await readJsonPayload(response);

      if (!response.ok) {
        const apiCode = typeof payload?.error?.code === "string" ? payload.error.code : undefined;
        throw new GenerateRecipeRequestError(mapApiError(response.status, apiCode));
      }

      if (!payload || typeof payload !== "object") {
        throw new GenerateRecipeRequestError({
          kind: "unknown",
          title: "Nieoczekiwany błąd",
          message: "Otrzymaliśmy niepoprawną odpowiedź serwera. Spróbuj ponownie.",
          retryable: true,
          httpStatus: response.status,
        });
      }

      return payload as GenerateRecipeResponseDTO;
    } catch (error) {
      if (error instanceof GenerateRecipeRequestError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new GenerateRecipeRequestError({
          kind: "timeout",
          title: "Upłynął limit czasu",
          message: "Generowanie trwało zbyt długo. Spróbuj ponownie.",
          retryable: true,
          httpStatus: 408,
        });
      }

      throw new GenerateRecipeRequestError({
        kind: "network",
        title: "Brak połączenia",
        message: "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
        retryable: true,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  return { generate };
}

async function readJsonPayload(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mapApiError(status: number, apiCode?: string): GenerateRecipeErrorVM {
  switch (status) {
    case 400:
      return {
        kind: "validation",
        title: "Niepoprawne dane",
        message: "Podaj co najmniej 3 składniki w formacie oddzielonym przecinkami.",
        retryable: false,
        httpStatus: status,
        apiCode,
      };
    case 401:
      return {
        kind: "unauthorized",
        title: "Sesja wygasła",
        message: "Zaloguj się ponownie, aby kontynuować.",
        retryable: false,
        httpStatus: status,
        apiCode,
      };
    case 408:
      return {
        kind: "timeout",
        title: "Upłynął limit czasu",
        message: "Generowanie trwało zbyt długo. Spróbuj ponownie.",
        retryable: true,
        httpStatus: status,
        apiCode,
      };
    case 502:
      return {
        kind: "provider",
        title: "Usługa niedostępna",
        message: "Usługa generowania jest chwilowo niedostępna. Spróbuj ponownie.",
        retryable: true,
        httpStatus: status,
        apiCode,
      };
    case 500:
      return {
        kind: "server",
        title: "Błąd zapisu",
        message: "Nie udało się zapisać przepisu. Spróbuj ponownie.",
        retryable: true,
        httpStatus: status,
        apiCode,
      };
    default:
      return {
        kind: "unknown",
        title: "Wystąpił błąd",
        message: "Coś poszło nie tak. Spróbuj ponownie.",
        retryable: true,
        httpStatus: status,
        apiCode,
      };
  }
}
