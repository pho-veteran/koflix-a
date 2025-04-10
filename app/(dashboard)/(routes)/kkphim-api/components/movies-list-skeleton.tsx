import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface MoviesListSkeletonProps {
  count?: number;
}

export const MoviesListSkeleton = ({ count = 24 }: MoviesListSkeletonProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden p-0 py-0 shadow-none">
          <div className="aspect-[2/3] relative bg-muted">
            <Skeleton className="h-full w-full" />
          </div>
          <CardContent className="p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};