import { Skeleton } from "@/components/ui/skeleton";

export interface RecipesListSkeletonProps {
  items?: number;
}

export function RecipesListSkeleton({ items = 6 }: RecipesListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={`recipe-skeleton-${index}`} className="rounded-xl border border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
