"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompactSearchBarProps {
  placeholder: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching?: boolean;
  resultsCount?: number;
  resultsLabel?: {
    singular: string;
    plural: string;
  };
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  className?: string;
}

export const CompactSearchBar = memo(({
  placeholder,
  searchQuery,
  onSearchChange,
  isSearching = false,
  resultsCount,
  resultsLabel,
  showDeleted,
  onToggleDeleted,
  className = "",
}: CompactSearchBarProps) => {
  const getResultsText = () => {
    if (!resultsCount || !resultsLabel) return null;
    if (resultsCount === 1) {
      return resultsLabel.singular;
    }
    return resultsLabel.plural;
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={placeholder}
          className="pl-10 pr-10 h-9"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {searchQuery && resultsCount !== undefined && resultsLabel && (
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {resultsCount} {getResultsText()}
          </Badge>
        )}
        {onToggleDeleted && (
          <Button
            variant={showDeleted ? "default" : "outline"}
            size="sm"
            onClick={onToggleDeleted}
            className="h-9 gap-2"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs">{showDeleted ? "Скрыть удаленные" : "Удаленные"}</span>
          </Button>
        )}
      </div>
    </div>
  );
});

CompactSearchBar.displayName = "CompactSearchBar";
