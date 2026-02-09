import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const EntityDetailSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-12 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-full mt-1" />
            <Skeleton className="h-4 w-32 mt-5" />
            <Skeleton className="h-9 w-full mt-1" />
            <Skeleton className="h-4 w-48 mt-5" />
            <Skeleton className="aspect-video w-full mt-1" />
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
