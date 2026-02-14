"use client";

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface ListFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  children: ReactNode;
}

export function ListFiltersSheet({
  open,
  onOpenChange,
  title = "Фильтры",
  activeFiltersCount = 0,
  onResetFilters,
  children,
}: ListFiltersSheetProps) {
  const displayTitle =
    activeFiltersCount > 0 ? `${title} (${activeFiltersCount})` : title;
  const canReset = activeFiltersCount > 0 && onResetFilters;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="flex-row items-center justify-between space-y-0">
          <SheetTitle>{displayTitle}</SheetTitle>
          {canReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
