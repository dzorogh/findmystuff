"use client";

import {
  Select,
  SelectItem,
  SelectGroup,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, RotateCcw, SortAsc } from "lucide-react";
import { SearchField } from "@/components/fields/search";
import {
  ENTITY_SORT_OPTIONS,
  type EntitySortOption,
} from "@/lib/entities/helpers/sort";
import { ButtonGroup, ButtonGroupSeparator } from "../ui/button-group";

export interface EntityListToolbarProps {
  placeholder?: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sort: EntitySortOption;
  onSortChange: (sort: EntitySortOption) => void;
  activeFiltersCount?: number;
  onOpenFilters: () => void;
  onResetFilters?: () => void;
}

export function EntityListToolbar({
  placeholder = "Поиск...",
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
  activeFiltersCount = 0,
  onOpenFilters,
  onResetFilters,
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
        <Select items={ENTITY_SORT_OPTIONS} value={sort} onValueChange={(v) => v != null && onSortChange(v as EntitySortOption)}>
          <SelectTrigger >
            <SortAsc data-icon="inline-start" />
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

        <ButtonGroup>
          <Button
            variant="outline"
            size="default"
            onClick={onOpenFilters}
          >
            <Filter data-icon="inline-start" />
            <span className="hidden sm:inline">Фильтры</span>
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="group-hover:hidden w-6"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <>
              <ButtonGroupSeparator />
              <Button onClick={onResetFilters} variant="destructive">
                <RotateCcw data-icon="inline-start" />
              </Button>
            </>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
}
