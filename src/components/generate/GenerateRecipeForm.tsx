import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { IngredientsTextareaField } from "@/components/generate/IngredientsTextareaField";

interface GenerateRecipeFormProps {
  ingredients: string;
  isSubmitting: boolean;
  fieldError?: string | null;
  ingredientsCount: number;
  onIngredientsChange: (value: string) => void;
  onSubmit: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  describedById: string;
}

export function GenerateRecipeForm({
  ingredients,
  isSubmitting,
  fieldError,
  ingredientsCount,
  onIngredientsChange,
  onSubmit,
  textareaRef,
  describedById,
}: GenerateRecipeFormProps) {
  return (
    <form
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-4">
        <IngredientsTextareaField
          value={ingredients}
          onChange={onIngredientsChange}
          error={fieldError}
          disabled={isSubmitting}
          describedById={describedById}
          textareaRef={textareaRef}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Liczba składników: <span className="font-medium text-foreground">{ingredientsCount}</span>
          </p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generuję..." : "Generuj przepis"}
          </Button>
        </div>
      </div>
    </form>
  );
}
