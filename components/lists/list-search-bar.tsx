"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { SearchField } from "@/components/fields/search";

interface ListSearchBarProps {
  placeholder: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSearching?: boolean;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  className?: string;
  actions?: React.ReactNode;
}

export const ListSearchBar = memo(function ListSearchBar({
  placeholder,
  searchQuery,
  onSearchChange,
  showDeleted,
  onToggleDeleted,
  className = "",
  actions,
}: ListSearchBarProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <SearchField
          placeholder={placeholder}
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {onToggleDeleted && (
          <Button
            variant={showDeleted ? "default" : "outline"}
            size="default"
            onClick={onToggleDeleted}
            className="gap-2"
          >
            <Filter className="h-3.5 w-3.5 sm:mr-2" />
            <span className="text-xs hidden sm:inline">
              {showDeleted ? "Скрыть удаленные" : "Удаленные"}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
});
