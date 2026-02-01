import { useCallback, useId, useMemo, useRef, useState } from "react";

import type { GenerateRecipeCommand } from "@/types";
import { useGenerateRecipe, GenerateRecipeRequestError } from "@/components/hooks/useGenerateRecipe";
import { GenerateRecipeForm } from "@/components/generate/GenerateRecipeForm";
import { GenerateStatusArea } from "@/components/generate/GenerateStatusArea";
import type { GenerateRecipeErrorVM, GenerateRecipeViewState } from "@/components/generate/types";

const INGREDIENTS_SPLIT_REGEX = /[,;\n]+/;
const INGREDIENTS_MIN_COUNT = 3;
const INGREDIENTS_MAX_LENGTH = 2000;

interface GenerateTabProps {
  onUnauthorized?: () => void;
  defaultIngredients?: string;
}

export function GenerateTab({ onUnauthorized, defaultIngredients = "" }: GenerateTabProps) {
  const { generate } = useGenerateRecipe();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldErrorId = useId();

  const [state, setState] = useState<GenerateRecipeViewState>({
    status: "idle",
    ingredients: defaultIngredients,
    fieldError: null,
    result: null,
    error: null,
  });

  const isSubmitting = state.status === "submitting";

  const ingredientsCount = useMemo(() => splitIngredients(state.ingredients).length, [state.ingredients]);

  const handleIngredientsChange = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      ingredients: value,
      fieldError: prev.fieldError ? null : prev.fieldError,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const fieldError = validateIngredients(state.ingredients, ingredientsCount);

    if (fieldError) {
      setState((prev) => ({
        ...prev,
        fieldError,
        status: "idle",
      }));
      textareaRef.current?.focus();
      return;
    }

    setState((prev) => ({
      ...prev,
      status: "submitting",
      fieldError: null,
      error: null,
    }));

    try {
      const command: GenerateRecipeCommand = {
        ingredients: state.ingredients.trim(),
        include_basics: true,
      };
      const result = await generate(command);
      setState((prev) => ({
        ...prev,
        status: "success",
        result,
        error: null,
      }));
    } catch (error) {
      const mappedError = mapClientError(error);

      if (mappedError.kind === "unauthorized") {
        onUnauthorized?.();
        return;
      }

      setState((prev) => ({
        ...prev,
        status: "error",
        error: mappedError,
      }));
    }
  }, [generate, ingredientsCount, isSubmitting, onUnauthorized, state.ingredients]);

  const handleRetry = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  const handleGenerateAnother = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: "idle",
      result: null,
      error: null,
    }));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <GenerateRecipeForm
        ingredients={state.ingredients}
        isSubmitting={isSubmitting}
        fieldError={state.fieldError}
        onIngredientsChange={handleIngredientsChange}
        onSubmit={handleSubmit}
        textareaRef={textareaRef}
        describedById={fieldErrorId}
        ingredientsCount={ingredientsCount}
      />
      <GenerateStatusArea state={state} onRetry={handleRetry} onGenerateAnother={handleGenerateAnother} />
    </div>
  );
}

function splitIngredients(ingredients: string): string[] {
  return ingredients
    .split(INGREDIENTS_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateIngredients(ingredients: string, count: number): string | null {
  if (!ingredients.trim()) {
    return "Wpisz składniki, aby wygenerować przepis.";
  }

  if (ingredients.length > INGREDIENTS_MAX_LENGTH) {
    return `Maksymalna długość to ${INGREDIENTS_MAX_LENGTH} znaków.`;
  }

  if (count < INGREDIENTS_MIN_COUNT) {
    return "Podaj co najmniej 3 składniki w formacie oddzielonym przecinkami.";
  }

  return null;
}

function mapClientError(error: unknown): GenerateRecipeErrorVM {
  if (error instanceof GenerateRecipeRequestError) {
    return error.error;
  }

  return {
    kind: "unknown",
    title: "Wystąpił błąd",
    message: "Coś poszło nie tak. Spróbuj ponownie.",
    retryable: true,
  };
}
