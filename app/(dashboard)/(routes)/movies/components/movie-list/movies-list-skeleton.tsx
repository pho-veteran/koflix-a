import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface MoviesListSkeletonProps {
  count?: number;
}

export const MoviesListSkeleton = ({ count = 24 }: MoviesListSkeletonProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-lg border shadow-sm overflow-hidden py-0">
          <CardContent className="p-0">
            <div className="aspect-[2/3] relative bg-muted rounded-t-md">
              <Skeleton className="h-full w-full rounded-none" />
              
              {/* Top right badges */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              
              {/* Bottom badges in the same layout as movie card */}
              <div className="absolute bottom-0 inset-x-0 z-10 p-3 flex justify-between items-end">
                {/* Left badges */}
                <div className="flex flex-col items-start gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                
                {/* Right badges */}
                <div className="flex flex-col gap-1.5 items-end">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="p-3 pt-2 min-h-[60px] flex-col items-start">
            <div className="w-full mt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-1" />
              
              {/* Rating bar skeleton */}
              <div className="w-full mt-2">
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};