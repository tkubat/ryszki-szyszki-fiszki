import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecipeDTO } from "@/types";
import { RecipeStepsRenderer } from "@/components/generate/RecipeStepsRenderer";

interface RecipeResultCardProps {
  recipe: RecipeDTO;
  generationTimeMs?: number;
  onGenerateAnother: () => void;
}

export function RecipeResultCard({ recipe, generationTimeMs, onGenerateAnother }: RecipeResultCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{recipe.title}</CardTitle>
        {typeof generationTimeMs === "number" ? (
          <p className="text-sm text-muted-foreground">
            Czas generowania: {(generationTimeMs / 1000).toFixed(1)} s
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <RecipeStepsRenderer steps={recipe.steps} />
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" onClick={onGenerateAnother}>
          Generuj kolejny
        </Button>
      </CardFooter>
    </Card>
  );
}
