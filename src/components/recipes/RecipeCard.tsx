import type { RecipeCardViewModel } from "@/lib/recipes/recipes.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LikeToggleButton } from "./LikeToggleButton";
import { RecipeDetails } from "./RecipeDetails";

export interface RecipeCardProps {
  recipe: RecipeCardViewModel;
  isPending: boolean;
  onToggleLiked: (recipeId: string, nextLiked: boolean) => void;
}

export function RecipeCard({ recipe, isPending, onToggleLiked }: RecipeCardProps) {
  const handleToggle = (nextLiked: boolean) => {
    onToggleLiked(recipe.id, nextLiked);
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>
              <h3 className="text-lg font-semibold">{recipe.title}</h3>
            </CardTitle>
            <CardDescription>{recipe.createdAtLabel}</CardDescription>
          </div>
          <LikeToggleButton liked={recipe.liked} isPending={isPending} onToggle={handleToggle} />
        </div>
      </CardHeader>
      <CardContent>
        <RecipeDetails ingredients={recipe.ingredients} steps={recipe.steps} />
      </CardContent>
    </Card>
  );
}
