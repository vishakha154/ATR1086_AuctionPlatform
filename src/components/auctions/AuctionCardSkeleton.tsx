import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface AuctionCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export function AuctionCardSkeleton({ viewMode = 'grid' }: AuctionCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <Card>
        <div className="flex">
          <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-l-lg rounded-r-none" />
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24 mt-1" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-0">
        <Skeleton className="aspect-video rounded-t-lg rounded-b-none" />
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <div className="w-full flex items-center justify-between">
          <div>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-20 mt-1" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-full" />
      </CardFooter>
    </Card>
  );
}
