import type { RefObject } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface IngredientsTextareaFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  describedById: string;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

export function IngredientsTextareaField({
  value,
  onChange,
  error,
  disabled,
  describedById,
  textareaRef,
}: IngredientsTextareaFieldProps) {
  const helperId = `${describedById}-helper`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="ingredients">Składniki</Label>
      <Textarea
        id="ingredients"
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="np. pomidory, makaron, bazylia"
        aria-describedby={`${helperId}${error ? ` ${describedById}` : ""}`}
        aria-invalid={Boolean(error)}
      />
      <p id={helperId} className="text-sm text-muted-foreground">
        Wpisz składniki rozdzielone przecinkami, średnikami lub nową linią (min. 3).
      </p>
      {error ? (
        <p id={describedById} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
