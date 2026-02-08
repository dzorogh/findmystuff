"use client";

import {
  Select,
  SelectItem,
  SelectGroup,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { SearchField } from "@/components/fields/search";
import {
  ENTITY_SORT_OPTIONS,
  type EntitySortOption,
} from "@/lib/entities/helpers/sort";

export interface EntityListToolbarProps {
  placeholder?: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sort: EntitySortOption;
  onSortChange: (sort: EntitySortOption) => void;
  activeFiltersCount?: number;
  onOpenFilters: () => void;
}

export function EntityListToolbar({
  placeholder = "Поиск...",
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
  activeFiltersCount = 0,
  onOpenFilters,
}: EntityListToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <SearchField
          placeholder={placeholder}
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Select value={sort} onValueChange={(v) => v != null && onSortChange(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
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
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-5 px-1.5 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
