import { ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LikeToggleButtonProps {
  liked: boolean;
  isPending?: boolean;
  onToggle: (nextLiked: boolean) => void;
}

export function LikeToggleButton({ liked, isPending = false, onToggle }: LikeToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={liked}
      aria-label={liked ? "Cofnij polubienie" : "Polub przepis"}
      onClick={() => onToggle(!liked)}
      disabled={isPending}
    >
      <ThumbsUp
        className={cn(
          "size-4 transition-colors",
          liked ? "fill-primary text-primary" : "text-muted-foreground",
        )}
      />
    </Button>
  );
}
