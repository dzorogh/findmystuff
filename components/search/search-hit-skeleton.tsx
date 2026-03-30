"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SearchHitSkeleton() {
  return (
    <div className="group block h-full">
      <Card className="h-full overflow-hidden">
        <CardContent className="h-full">
          <div className="flex h-full min-w-0 items-start gap-4">
            {/* Изображение / Заглушка */}
            <Skeleton className="relative h-24 w-24 shrink-0 rounded-none sm:h-28 sm:w-28" />

            <div className="flex h-full min-w-0 flex-1 flex-col py-1">
              {/* Заголовок и подзаголовок */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2.5">
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
                
                {/* Круг релевантности */}
                <Skeleton className="size-5 shrink-0 rounded-full" />
              </div>

              {/* Локации */}
              <div
                className={cn(
                  "mt-5 grid gap-x-4 gap-y-2 overflow-hidden",
                  "grid-cols-1 sm:grid-cols-2"
                )}
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex min-w-0 items-start gap-2 hidden sm:flex">
                  <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
