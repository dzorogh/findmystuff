"use client";

import { SearchBar } from "@/components/common/search-bar";
import { Select, SelectItem, SelectGroup, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import {
  ENTITY_SORT_OPTIONS,
  type EntitySortOption,
} from "@/lib/entities/helpers/sort";

interface EntityListToolbarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching?: boolean;
  activeFiltersCount?: number;
  onOpenFilters: () => void;
  sort: EntitySortOption;
  onSortChange: (sort: EntitySortOption) => void;
}

export const EntityListToolbar = ({
  searchQuery,
  onSearchChange,
  isSearching,
  activeFiltersCount = 0,
  onOpenFilters,
  sort,
  onSortChange,
}: EntityListToolbarProps) => {
  return (
    <SearchBar
      placeholder="Поиск..."
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      isSearching={isSearching}
      actions={
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(value) => onSortChange(value as EntitySortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ENTITY_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
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
