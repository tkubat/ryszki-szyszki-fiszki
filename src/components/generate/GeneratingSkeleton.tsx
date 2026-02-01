import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GeneratingSkeletonProps {
  label?: string;
}

export function GeneratingSkeleton({ label = "Generuję przepis..." }: GeneratingSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-medium text-foreground" aria-live="polite">
          {label}
        </p>
        <p className="text-sm text-muted-foreground">To może potrwać do 60 sekund.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}
