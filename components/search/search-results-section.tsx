"use client";

import { Search, ScanSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SearchHit, SearchMode } from "@/lib/search/types";
import { SearchHitCard } from "@/components/search/search-hit-card";

interface SearchResultsSectionProps {
  title: string;
  hits: SearchHit[];
  isLoading: boolean;
  mode: SearchMode;
  emptyMessage: string;
}

export function SearchResultsSection({
  title,
  hits,
  isLoading,
  mode,
  emptyMessage,
}: SearchResultsSectionProps) {
  const EmptyIcon = mode === "image" ? ScanSearch : Search;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold sm:text-xl">
          {title}
          {hits.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({hits.length})
            </span>
          )}
        </h2>
      </div>

      {isLoading && hits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Ищем результаты...
          </CardContent>
        </Card>
      ) : hits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <EmptyIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:gap-4">
          {hits.map((hit) => (
            <SearchHitCard
              key={`${hit.entityType}-${hit.entityId}-${hit.match?.source ?? "base"}`}
              hit={hit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
