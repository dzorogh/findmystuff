"use client";

import { CompactSearchBar } from "@/components/common/compact-search-bar";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import {
  ENTITY_SORT_OPTIONS,
  type EntitySortOption,
} from "@/lib/entities/helpers/sort";

interface EntityListToolbarProps {
  placeholder: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching?: boolean;
  resultsCount?: number;
  resultsLabel?: {
    singular: string;
    plural: string;
  };
  activeFiltersCount?: number;
  onOpenFilters: () => void;
  sort: EntitySortOption;
  onSortChange: (sort: EntitySortOption) => void;
}

export const EntityListToolbar = ({
  placeholder,
  searchQuery,
  onSearchChange,
  isSearching,
  resultsCount,
  resultsLabel,
  activeFiltersCount = 0,
  onOpenFilters,
  sort,
  onSortChange,
}: EntityListToolbarProps) => {
  return (
    <CompactSearchBar
      placeholder={placeholder}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      resultsCount={resultsCount}
      resultsLabel={resultsLabel}
      actions={
        <div className="flex items-center gap-2">
          <Select
            size="default"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as EntitySortOption)}
            className="min-w-[170px]"
            aria-label="Сортировка"
          >
            {ENTITY_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="default"
            onClick={onOpenFilters}
            className={activeFiltersCount > 0 ? "border-primary" : ""}
          >
            <Filter className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Фильтры</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      }
    />
  );
};
